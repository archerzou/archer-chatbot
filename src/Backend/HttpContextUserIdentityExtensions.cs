using System.Security.Claims;

namespace CustomerWebUI;

public static class HttpContextUserIdentityExtensions
{
    /// <summary>
    /// The caller's <c>sub</c> claim, usable to scope data to any authenticated user regardless of
    /// role (unlike <see cref="GetRequiredCustomerId"/>, which rejects staff).
    /// </summary>
    public static string GetRequiredUserId(this HttpContext httpContext)
    {
        if (httpContext.User.Identity is { IsAuthenticated: true } and ClaimsIdentity claimsIdentity
            && claimsIdentity.FindFirst("sub") is { Value: string sub })
        {
            return sub;
        }

        throw new InvalidOperationException("User is not authenticated or missing 'sub' claim");
    }

    public static int GetRequiredCustomerId(this HttpContext httpContext)
    {
        if (httpContext.User.IsInRole("staff"))
        {
            throw new InvalidOperationException("The current user is not a customer; they are in 'staff' role.");
        }

        if (httpContext.User.Identity is { IsAuthenticated: true } and ClaimsIdentity claimsIdentity
            && claimsIdentity.FindFirst("sub") is { Value: string subscriberIdString })
        {
            return int.Parse(subscriberIdString);
        }

        throw new InvalidOperationException("User is not authenticated or missing 'sub' claim");
    }
}
