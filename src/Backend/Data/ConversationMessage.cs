namespace eShopSupport.Backend.Data;

/// <summary>
/// One message in a <see cref="Conversation"/>. The typed content blocks (text / citations /
/// products / categories) are stored as JSON in <see cref="BlocksJson"/> so the persisted shape
/// matches the streamed contract 1:1 (see <c>Backend/Api/ChatContracts.cs</c>).
/// </summary>
public class ConversationMessage
{
    public int ConversationMessageId { get; set; }

    public int ConversationId { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>"user" or "assistant".</summary>
    public required string Role { get; set; }

    /// <summary>JSON-serialized list of <c>ChatBlock</c>.</summary>
    public required string BlocksJson { get; set; }
}
