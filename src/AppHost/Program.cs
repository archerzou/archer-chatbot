using Microsoft.Extensions.Configuration.Json;
using Microsoft.Extensions.Hosting;
using Projects;

var builder = DistributedApplication.CreateBuilder(args);
builder.Configuration.Sources.Add(new JsonConfigurationSource { Path = "appsettings.Local.json", Optional = true });

// Stamp every container with the Docker Compose "project" label so Docker Desktop groups them
// all under a single collapsible folder (like "daymark" or "calconnect") instead of listing each
// container at the top level.
string[] containerGroupLabel = ["--label", "com.docker.compose.project=archer-chatbot"];

var dbPassword = builder.AddParameter("PostgresPassword", secret: true);

var postgresServer = builder
    .AddPostgres("eshopsupport-postgres", password: dbPassword)
    .WithDataVolume()
    .WithContainerRuntimeArgs(containerGroupLabel);
var backendDb = postgresServer
    .AddDatabase("backenddb");

var vectorDb = builder
    .AddQdrant("vector-db")
    .WithVolume("eshopsupport-vector-db-storage", "/qdrant/storage")
    .WithContainerRuntimeArgs(containerGroupLabel);

var identityServer = builder.AddProject<IdentityServer>("identity-server")
    .WithExternalHttpEndpoints();

var identityEndpoint = identityServer
    .GetEndpoint("https");

// Default: run chat completion locally with Ollama.
// The resource is named "chatcompletion" so the backend can reach it at http://chatcompletion.
var ollamaModelName = builder.Configuration["OllamaModel"] ?? "llama3.1";
var chatCompletion = builder.AddOllama("chatcompletion")
    .WithDataVolume()
    .WithContainerRuntimeArgs(containerGroupLabel);
// Enable GPU acceleration on machines with a supported Nvidia GPU:
// .WithGPUSupport();
var chatModel = chatCompletion.AddModel("chat-model", ollamaModelName);

// ... or use OpenAI instead by configuring a "chatcompletion" connection string in appsettings
// and swapping the backend reference below for: .WithReference(builder.AddConnectionString("chatcompletion"))

var storage = builder.AddAzureStorage("eshopsupport-storage");
if (builder.Environment.IsDevelopment())
{
    storage.RunAsEmulator(r => r.WithDataVolume().WithContainerRuntimeArgs(containerGroupLabel));
}

var blobStorage = storage.AddBlobs("eshopsupport-blobs");

var pythonInference = builder.AddPythonUvicornApp("python-inference",
    Path.Combine("..", "PythonInference"), port: 62394);

var redis = builder.AddRedis("redis")
    .WithContainerRuntimeArgs(containerGroupLabel);

builder.AddProject<Backend>("backend")
    .WithReference(backendDb)
    .WithReference(blobStorage)
    .WithReference(vectorDb)
    .WithReference(pythonInference)
    .WithReference(redis)
    .WithReference(chatCompletion)
    .WaitFor(chatModel)
    .WithEnvironment("chatcompletion:Type", "ollama")
    .WithEnvironment("chatcompletion:LlmModelName", ollamaModelName)
    .WithEnvironment("IdentityUrl", identityEndpoint)
    .WithEnvironment("ImportInitialDataDir", Path.Combine(builder.AppHostDirectory, "..", "..", "seeddata", "dev"));

builder.Build().Run();
