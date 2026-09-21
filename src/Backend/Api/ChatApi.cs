using System.ComponentModel;
using System.Text;
using System.Text.Json;
using CustomerWebUI;
using eShopSupport.Backend.Data;
using eShopSupport.Backend.Services;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.SemanticKernel.Embeddings;

namespace eShopSupport.Backend.Api;

/// <summary>
/// Customer-facing, persistent, general + business conversational endpoint (design section D /
/// Phase 3). Unlike the staff, ticket-shaped <c>/api/assistant/chat</c>, this is available to any
/// authenticated user, persists the turn, and streams typed blocks over SSE. Intent (general vs
/// business) is decided server-side by letting the model call the manual / catalog search tools; the
/// frontend stays intent-agnostic and just renders the returned blocks.
/// </summary>
public static class ChatApi
{
    private const string SystemPrompt = """
        You are a helpful AI assistant for AdventureWorks, an online outdoor-and-adventure retailer.
        You help customers with product discovery, product how-to/maintenance questions, and general enquiries.

        Use the available tools to look things up when they are relevant:
        - finding, comparing, or recommending products (including price) — use the product-catalog tool
        - how-to, cleaning, maintenance, or troubleshooting a product — use the product-manual tool
        - suggesting sections the customer could browse — use the category tool

        For anything else — general questions, small talk, or topics unrelated to the shop — just answer
        directly from your own knowledge. If you genuinely cannot answer (for example real-time data such
        as today's weather), say so briefly and, if helpful, suggest what you can do instead.

        How to write your reply:
        - Reply with ONLY the answer for the customer, in plain, friendly language.
        - NEVER mention tools or function names, NEVER output JSON or function calls, and NEVER describe
          your own reasoning or decision about whether to use a tool.
        - When your answer comes from a product manual, justify it with this exact syntax:
          <cite searchResultId=number>shortVerbatimQuote</cite>
          where shortVerbatimQuote is a very short, EXACT quote (max 10 words) from the cited search result.

        Keep answers concise.
        """;

    public static void MapChatApiEndpoints(this WebApplication app)
    {
        app.MapPost("/api/chat", StreamChatAsync).RequireAuthorization("AuthenticatedApi");
    }

    private static async Task StreamChatAsync(
        ChatRequest request,
        HttpContext httpContext,
        AppDbContext dbContext,
        ProductManualSemanticSearch manualSearch,
        ProductSemanticSearch productSearch,
        ITextEmbeddingGenerationService embedder,
        IChatClient chatClient,
        CancellationToken cancellationToken)
    {
        var ownerSub = httpContext.GetRequiredUserId();

        // Load the conversation (owner-scoped) or implicitly create a new one.
        var conversation = request.ConversationId is int conversationId
            ? await dbContext.Conversations.Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.ConversationId == conversationId && c.OwnerSub == ownerSub, cancellationToken)
            : null;

        if (request.ConversationId is not null && conversation is null)
        {
            httpContext.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        var now = DateTime.UtcNow;
        var isNew = conversation is null;
        conversation ??= new Conversation
        {
            OwnerSub = ownerSub,
            Title = ConversationTitle.Default,
            CreatedAt = now,
            UpdatedAt = now,
        };
        if (isNew)
        {
            dbContext.Conversations.Add(conversation);
        }

        // Title the conversation from its first user message (covers both implicit-create and an
        // explicitly-created but still-empty conversation).
        var isFirstMessage = conversation.Messages.Count == 0;

        // Persist the user message up front so it survives a broken/aborted stream.
        conversation.Messages.Add(new ConversationMessage
        {
            Role = "user",
            CreatedAt = now,
            BlocksJson = ChatJson.SerializeBlocks([new TextChatBlock(request.Message)]),
        });
        if (isFirstMessage)
        {
            conversation.Title = ConversationTitle.FromMessage(request.Message);
        }
        conversation.Preview = ConversationTitle.Preview(request.Message);
        conversation.UpdatedAt = now;
        await dbContext.SaveChangesAsync(cancellationToken);

        // Begin the SSE stream.
        httpContext.Response.Headers.ContentType = "text/event-stream";
        httpContext.Response.Headers.CacheControl = "no-cache";
        httpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();

        var messages = BuildChatMessages(conversation);
        var tools = new ChatTools(httpContext.Response, manualSearch, productSearch, embedder, dbContext, cancellationToken);
        var options = new ChatOptions
        {
            Temperature = 0,
            Tools =
            [
                AIFunctionFactory.Create(tools.SearchManual),
                AIFunctionFactory.Create(tools.SearchProducts),
                AIFunctionFactory.Create(tools.SearchCategories),
            ],
            AdditionalProperties = new() { ["seed"] = 0 },
        };

        var answer = new StringBuilder();
        try
        {
            await foreach (var chunk in chatClient.GetStreamingResponseAsync(messages, options, cancellationToken))
            {
                var text = chunk.ToString();
                if (string.IsNullOrEmpty(text))
                {
                    continue;
                }
                answer.Append(text);
                await WriteEventAsync(httpContext.Response, "token", new { text }, cancellationToken);
            }

            // Emit collected manual citations (correlated to the inline <cite> tags) at the end.
            if (tools.Citations.Count > 0)
            {
                await WriteBlockAsync(httpContext.Response, new CitationsChatBlock(tools.Citations), cancellationToken);
            }

            var assistantMessage = await PersistAssistantMessageAsync(dbContext, conversation, answer.ToString(), tools, cancellationToken);

            await WriteEventAsync(httpContext.Response, "done", new
            {
                conversationId = conversation.ConversationId,
                messageId = assistantMessage.ConversationMessageId,
                title = conversation.Title,
            }, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            // Client aborted (Stop). Persist whatever answer we have so history stays consistent.
            if (answer.Length > 0)
            {
                await PersistAssistantMessageAsync(dbContext, conversation, answer.ToString(), tools, CancellationToken.None);
            }
        }
        catch (Exception ex)
        {
            await WriteEventAsync(httpContext.Response, "error", new { message = ex.Message }, CancellationToken.None);
        }
    }

    private static async Task<ConversationMessage> PersistAssistantMessageAsync(
        AppDbContext dbContext, Conversation conversation, string answer, ChatTools tools, CancellationToken cancellationToken)
    {
        var blocks = new List<ChatBlock> { new TextChatBlock(answer) };
        blocks.AddRange(tools.Blocks);
        if (tools.Citations.Count > 0)
        {
            blocks.Add(new CitationsChatBlock(tools.Citations));
        }

        var message = new ConversationMessage
        {
            Role = "assistant",
            CreatedAt = DateTime.UtcNow,
            BlocksJson = ChatJson.SerializeBlocks(blocks),
        };
        conversation.Messages.Add(message);
        conversation.Preview = ConversationTitle.Preview(answer);
        conversation.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return message;
    }

    private static List<ChatMessage> BuildChatMessages(Conversation conversation)
    {
        var messages = new List<ChatMessage> { new(ChatRole.System, SystemPrompt) };
        foreach (var message in conversation.Messages.OrderBy(m => m.ConversationMessageId))
        {
            var text = string.Concat(ChatJson.DeserializeBlocks(message.BlocksJson).OfType<TextChatBlock>().Select(b => b.Text));
            if (!string.IsNullOrWhiteSpace(text))
            {
                messages.Add(new(message.Role == "assistant" ? ChatRole.Assistant : ChatRole.User, text));
            }
        }
        return messages;
    }

    private static Task WriteBlockAsync(HttpResponse response, ChatBlock block, CancellationToken cancellationToken)
        => WriteRawEventAsync(response, "block", JsonSerializer.Serialize(block, typeof(ChatBlock), ChatJson.Options), cancellationToken);

    private static Task WriteEventAsync(HttpResponse response, string eventName, object data, CancellationToken cancellationToken)
        => WriteRawEventAsync(response, eventName, JsonSerializer.Serialize(data, ChatJson.Options), cancellationToken);

    private static async Task WriteRawEventAsync(HttpResponse response, string eventName, string json, CancellationToken cancellationToken)
    {
        await response.WriteAsync($"event: {eventName}\ndata: {json}\n\n", cancellationToken);
        await response.Body.FlushAsync(cancellationToken);
    }

    /// <summary>
    /// The search tools the model can call. Each tool emits a live SSE affordance/block and collects
    /// the resulting typed blocks so the completed assistant message can be persisted. A semaphore
    /// serializes tool calls so their SSE writes don't interleave.
    /// </summary>
    private sealed class ChatTools(
        HttpResponse response,
        ProductManualSemanticSearch manualSearch,
        ProductSemanticSearch productSearch,
        ITextEmbeddingGenerationService embedder,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        private readonly SemaphoreSlim semaphore = new(1);

        public List<ChatBlock> Blocks { get; } = [];
        public List<ChatCitation> Citations { get; } = [];

        [Description("Searches the product manuals for how-to, maintenance, and troubleshooting information.")]
        public async Task<object> SearchManual(
            [Description("A phrase to use when searching the manuals")] string searchPhrase,
            [Description("ID of the product whose manual to search. Set to null to search across all product manuals.")] int? productId)
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                await WriteEventAsync(response, "search", new { phrase = searchPhrase }, cancellationToken);
                var results = await manualSearch.SearchAsync(productId, searchPhrase);
                foreach (var r in results)
                {
                    var id = int.Parse(r.Metadata.Id);
                    if (!Citations.Any(c => c.SearchResultId == id))
                    {
                        Citations.Add(new ChatCitation(id, AssistantApi.GetProductId(r), AssistantApi.GetPageNumber(r), Truncate(r.Metadata.Text, 200)));
                    }
                }
                return results.Select(r => new { ProductId = AssistantApi.GetProductId(r), SearchResultId = r.Metadata.Id, r.Metadata.Text });
            }
            finally
            {
                semaphore.Release();
            }
        }

        [Description("Searches the product catalog to find, compare, or recommend products (returns brand, model, price, and category).")]
        public async Task<object> SearchProducts(
            [Description("A phrase describing the products to find")] string searchPhrase)
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                await WriteEventAsync(response, "search", new { phrase = searchPhrase }, cancellationToken);
                var found = (await productSearch.FindProductsAsync(searchPhrase)).ToList();
                var ids = found.Select(f => f.ProductId).ToList();
                var products = await dbContext.Products
                    .Where(p => ids.Contains(p.ProductId))
                    .ToListAsync(cancellationToken);
                var categoryNames = await dbContext.ProductCategories
                    .Where(c => products.Select(p => p.CategoryId).Contains(c.CategoryId))
                    .ToDictionaryAsync(c => c.CategoryId, c => c.Name, cancellationToken);

                // Preserve the semantic-search ordering.
                var chatProducts = ids
                    .Select(id => products.FirstOrDefault(p => p.ProductId == id))
                    .OfType<Product>()
                    .Select(p => new ChatProduct(p.ProductId, p.Brand, p.Model, p.Price, categoryNames.GetValueOrDefault(p.CategoryId)))
                    .ToList();

                if (chatProducts.Count > 0)
                {
                    var block = new ProductsChatBlock(chatProducts);
                    Blocks.Add(block);
                    await WriteBlockAsync(response, block, cancellationToken);
                }
                return chatProducts.Select(p => new { p.ProductId, p.Brand, p.Model, p.Price, Category = p.CategoryName });
            }
            finally
            {
                semaphore.Release();
            }
        }

        [Description("Searches product categories to suggest relevant sections the customer can browse.")]
        public async Task<object> SearchCategories(
            [Description("A phrase describing the categories to find")] string searchPhrase)
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                await WriteEventAsync(response, "search", new { phrase = searchPhrase }, cancellationToken);
                var found = (await CatalogApi.SearchCategoriesCoreAsync(dbContext, embedder, searchPhrase, null)).ToList();
                var chatCategories = found.Select(c => new ChatCategory(c.CategoryId, c.Name)).ToList();
                if (chatCategories.Count > 0)
                {
                    var block = new CategoriesChatBlock(chatCategories);
                    Blocks.Add(block);
                    await WriteBlockAsync(response, block, cancellationToken);
                }
                return chatCategories.Select(c => c.Name);
            }
            finally
            {
                semaphore.Release();
            }
        }

        private static string Truncate(string text, int maxLength)
            => text.Length <= maxLength ? text : text[..maxLength].TrimEnd() + "…";
    }
}
