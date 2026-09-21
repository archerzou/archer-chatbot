using System.Text.Json;
using System.Text.Json.Serialization;

namespace eShopSupport.Backend.Api;

// Typed content blocks the assistant emits (design section B3 / D). These are the single source of
// truth for both the SSE `block` events and the persisted `ConversationMessage.BlocksJson`, so the
// streamed and reloaded shapes are identical. Serialized with a `kind` discriminator + camelCase
// property names (web defaults), which the WebUI consumes as a discriminated union.
[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(TextChatBlock), "text")]
[JsonDerivedType(typeof(CitationsChatBlock), "citations")]
[JsonDerivedType(typeof(ProductsChatBlock), "products")]
[JsonDerivedType(typeof(CategoriesChatBlock), "categories")]
public abstract record ChatBlock;

public record TextChatBlock(string Text) : ChatBlock;

public record CitationsChatBlock(IReadOnlyList<ChatCitation> Citations) : ChatBlock;

public record ProductsChatBlock(IReadOnlyList<ChatProduct> Products) : ChatBlock;

public record CategoriesChatBlock(IReadOnlyList<ChatCategory> Categories) : ChatBlock;

public record ChatCitation(int SearchResultId, int? ProductId, int? Page, string? Snippet);

public record ChatProduct(int ProductId, string Brand, string Model, decimal Price, string? CategoryName);

public record ChatCategory(int CategoryId, string Name);

// Request / response DTOs for the chat + conversation endpoints.
public record ChatRequest(int? ConversationId, string Message);

public record ConversationSummary(int Id, string Title, string? Preview, DateTime UpdatedAt);

public record ConversationDetail(
    int Id, string Title, DateTime CreatedAt, DateTime UpdatedAt, IReadOnlyList<ConversationMessageDto> Messages);

public record ConversationMessageDto(int Id, string Role, IReadOnlyList<ChatBlock> Blocks, DateTime CreatedAt);

public record CreateConversationResult(int Id, string Title, DateTime CreatedAt, DateTime UpdatedAt);

public record RenameConversationRequest(string Title);

/// <summary>Shared serializer settings used for SSE payloads and <c>BlocksJson</c> persistence.</summary>
internal static class ChatJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string SerializeBlocks(IReadOnlyList<ChatBlock> blocks)
        => JsonSerializer.Serialize(blocks, Options);

    public static List<ChatBlock> DeserializeBlocks(string json)
        => JsonSerializer.Deserialize<List<ChatBlock>>(json, Options) ?? [];
}
