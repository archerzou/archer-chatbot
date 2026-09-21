using System.ClientModel;
using System.Data.Common;
using Azure.AI.OpenAI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenAI;

namespace Microsoft.Extensions.Hosting;

public static class ServiceCollectionChatClientExtensions
{
    public static ChatClientBuilder AddOllamaChatClient(
        this IHostApplicationBuilder hostBuilder,
        string serviceName,
        string? modelName = null)
    {
        if (modelName is null)
        {
            var configKey = $"{serviceName}:LlmModelName";
            modelName = hostBuilder.Configuration[configKey];
            if (string.IsNullOrEmpty(modelName))
            {
                throw new InvalidOperationException($"No {nameof(modelName)} was specified, and none could be found from configuration at '{configKey}'");
            }
        }

        // The Aspire Ollama resource (CommunityToolkit.Aspire.Hosting.Ollama) does NOT inject
        // service-discovery endpoints (`services__{serviceName}__...`); it exposes the server as a
        // connection string (`ConnectionStrings__{serviceName}=Endpoint=http://host:port`). Resolving
        // a bare `http://{serviceName}` therefore fails with "No such host is known ({serviceName}:80)"
        // because service discovery has nothing to resolve and falls through to a literal DNS lookup.
        // Read the concrete endpoint from the connection string instead.
        return hostBuilder.Services.AddOllamaChatClient(
            modelName,
            ResolveOllamaEndpoint(hostBuilder.Configuration, serviceName));
    }

    private static Uri ResolveOllamaEndpoint(IConfiguration configuration, string serviceName)
    {
        var connectionString = configuration.GetConnectionString(serviceName);
        if (!string.IsNullOrEmpty(connectionString))
        {
            var builder = new DbConnectionStringBuilder { ConnectionString = connectionString };
            if (builder.TryGetValue("Endpoint", out var endpoint) && endpoint is string endpointValue
                && Uri.TryCreate(endpointValue, UriKind.Absolute, out var endpointUri))
            {
                return endpointUri;
            }

            // Some integrations set the bare URL as the whole connection string.
            if (Uri.TryCreate(connectionString, UriKind.Absolute, out var directUri))
            {
                return directUri;
            }
        }

        // Fallback to the service-discovery name form (works if endpoints ARE injected).
        return new Uri($"http://{serviceName}");
    }

    public static ChatClientBuilder AddOllamaChatClient(
        this IServiceCollection services,
        string modelName,
        Uri? uri = null)
    {
        uri ??= new Uri("http://localhost:11434");

        ChatClientBuilder chatClientBuilder = services.AddChatClient(serviceProvider => {
            var httpClient = serviceProvider.GetService<HttpClient>() ?? new();
            return new OllamaChatClient(uri, modelName, httpClient);
        });

        // Temporary workaround for Ollama issues
        chatClientBuilder.UsePreventStreamingWithFunctions();

        return chatClientBuilder;
    }

    public static ChatClientBuilder AddOpenAIChatClient(
        this IHostApplicationBuilder hostBuilder,
        string serviceName,
        string? modelOrDeploymentName = null)
    {
        // TODO: We would prefer to use Aspire.AI.OpenAI here, but it doesn't yet support the OpenAI v2 client.
        // So for now we access the connection string and set up a client manually.

        var connectionString = hostBuilder.Configuration.GetConnectionString(serviceName);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException($"No connection string named '{serviceName}' was found. Ensure a corresponding Aspire service was registered.");
        }

        var connectionStringBuilder = new DbConnectionStringBuilder();
        connectionStringBuilder.ConnectionString = connectionString;
        var endpoint = (string?)connectionStringBuilder["endpoint"];
        var apiKey = (string)connectionStringBuilder["key"] ?? throw new InvalidOperationException($"The connection string named '{serviceName}' does not specify a value for 'Key', but this is required.");

        modelOrDeploymentName ??= (connectionStringBuilder["Deployment"] ?? connectionStringBuilder["Model"]) as string;
        if (string.IsNullOrWhiteSpace(modelOrDeploymentName))
        {
            throw new InvalidOperationException($"The connection string named '{serviceName}' does not specify a value for 'Deployment' or 'Model', and no value was passed for {nameof(modelOrDeploymentName)}.");
        }

        var endpointUri = string.IsNullOrEmpty(endpoint) ? null : new Uri(endpoint);
        return hostBuilder.Services.AddOpenAIChatClient(apiKey, modelOrDeploymentName, endpointUri);
    }

    public static ChatClientBuilder AddOpenAIChatClient(
        this IServiceCollection services,
        string apiKey,
        string modelOrDeploymentName,
        Uri? endpoint = null)
    {
        return services
            .AddSingleton(_ => endpoint is null
                ? new OpenAIClient(apiKey)
                : new AzureOpenAIClient(endpoint, new ApiKeyCredential(apiKey)))
            .AddChatClient(pipeline =>
            {
                var openAiClient = pipeline.GetRequiredService<OpenAIClient>();
                return openAiClient.GetChatClient(modelOrDeploymentName).AsIChatClient();
            });
    }
}
