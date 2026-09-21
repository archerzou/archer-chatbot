namespace eShopSupport.Backend.Data;

/// <summary>
/// A persisted chat conversation owned by a single authenticated user (staff or customer). Owner is
/// keyed by the JWT <c>sub</c> claim so reads/writes only ever touch the caller's own conversations.
/// </summary>
public class Conversation
{
    public int ConversationId { get; set; }

    /// <summary>The owning user's <c>sub</c> claim (numeric for seeded users, but stored as text).</summary>
    public required string OwnerSub { get; set; }

    public required string Title { get; set; }

    /// <summary>Short snippet of the latest message, shown in the conversation list.</summary>
    public string? Preview { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public List<ConversationMessage> Messages { get; set; } = new();
}
