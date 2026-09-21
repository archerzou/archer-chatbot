using CustomerWebUI;
using eShopSupport.Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace eShopSupport.Backend.Api;

/// <summary>
/// Server-backed conversation history (design section D / Phase 3). Every handler scopes by the
/// caller's <c>sub</c> so a user only ever sees their own conversations; cross-owner access returns
/// 404 (never leaks existence). Available to any authenticated user (staff or customer).
/// </summary>
public static class ConversationApi
{
    private const string Policy = "AuthenticatedApi";

    public static void MapConversationApiEndpoints(this WebApplication app)
    {
        app.MapGet("/api/conversations", ListAsync).RequireAuthorization(Policy);
        app.MapGet("/api/conversations/{id:int}", GetAsync).RequireAuthorization(Policy);
        app.MapPost("/api/conversations", CreateAsync).RequireAuthorization(Policy);
        app.MapPatch("/api/conversations/{id:int}", RenameAsync).RequireAuthorization(Policy);
        app.MapDelete("/api/conversations/{id:int}", DeleteAsync).RequireAuthorization(Policy);
    }

    private static async Task<IReadOnlyList<ConversationSummary>> ListAsync(HttpContext httpContext, AppDbContext dbContext)
    {
        var ownerSub = httpContext.GetRequiredUserId();
        return await dbContext.Conversations
            .Where(c => c.OwnerSub == ownerSub)
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new ConversationSummary(c.ConversationId, c.Title, c.Preview, c.UpdatedAt))
            .ToListAsync();
    }

    private static async Task<IResult> GetAsync(HttpContext httpContext, AppDbContext dbContext, int id)
    {
        var ownerSub = httpContext.GetRequiredUserId();
        var conversation = await dbContext.Conversations
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.ConversationId == id && c.OwnerSub == ownerSub);

        if (conversation is null)
        {
            return Results.NotFound();
        }

        var messages = conversation.Messages
            .OrderBy(m => m.ConversationMessageId)
            .Select(m => new ConversationMessageDto(m.ConversationMessageId, m.Role, ChatJson.DeserializeBlocks(m.BlocksJson), m.CreatedAt))
            .ToList();

        return Results.Ok(new ConversationDetail(
            conversation.ConversationId, conversation.Title, conversation.CreatedAt, conversation.UpdatedAt, messages));
    }

    private static async Task<CreateConversationResult> CreateAsync(HttpContext httpContext, AppDbContext dbContext)
    {
        var now = DateTime.UtcNow;
        var conversation = new Conversation
        {
            OwnerSub = httpContext.GetRequiredUserId(),
            Title = ConversationTitle.Default,
            CreatedAt = now,
            UpdatedAt = now,
        };
        dbContext.Conversations.Add(conversation);
        await dbContext.SaveChangesAsync();

        return new CreateConversationResult(conversation.ConversationId, conversation.Title, conversation.CreatedAt, conversation.UpdatedAt);
    }

    private static async Task<IResult> RenameAsync(HttpContext httpContext, AppDbContext dbContext, int id, RenameConversationRequest request)
    {
        var ownerSub = httpContext.GetRequiredUserId();
        var conversation = await dbContext.Conversations
            .FirstOrDefaultAsync(c => c.ConversationId == id && c.OwnerSub == ownerSub);

        if (conversation is null)
        {
            return Results.NotFound();
        }

        conversation.Title = string.IsNullOrWhiteSpace(request.Title) ? ConversationTitle.Default : request.Title.Trim();
        await dbContext.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> DeleteAsync(HttpContext httpContext, AppDbContext dbContext, int id)
    {
        var ownerSub = httpContext.GetRequiredUserId();
        var conversation = await dbContext.Conversations
            .FirstOrDefaultAsync(c => c.ConversationId == id && c.OwnerSub == ownerSub);

        if (conversation is null)
        {
            return Results.NotFound();
        }

        dbContext.Conversations.Remove(conversation);
        await dbContext.SaveChangesAsync();
        return Results.NoContent();
    }
}

/// <summary>Helpers for deriving a conversation title/preview from message text.</summary>
internal static class ConversationTitle
{
    public const string Default = "New chat";

    public static string FromMessage(string message)
    {
        var text = message.Trim();
        if (string.IsNullOrEmpty(text))
        {
            return Default;
        }
        return text.Length > 40 ? text[..40].TrimEnd() + "…" : text;
    }

    public static string? Preview(string message)
    {
        var text = message.Trim();
        if (string.IsNullOrEmpty(text))
        {
            return null;
        }
        return text.Length > 80 ? text[..80].TrimEnd() + "…" : text;
    }
}
