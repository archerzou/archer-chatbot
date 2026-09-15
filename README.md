# archer_chatbot

A backend-only .NET 10 chatbot service, orchestrated with .NET Aspire, that answers business
and general questions using an LLM (Ollama locally by default, or OpenAI). It is a slimmed-down
derivative of the [eShopSupport](https://github.com/dotnet/eShopSupport) sample, keeping only the
online, service-side pieces so a separate React frontend can be added later.

## Projects

| Project | Role |
| --- | --- |
| `src/Backend` | Minimal API: chat/assistant endpoints, catalog, tickets, semantic search |
| `src/ServiceDefaults` | Shared Aspire wiring: telemetry, service discovery, chat-client setup |
| `src/AppHost` | .NET Aspire orchestration (Postgres, Qdrant, Redis, Blob storage, Ollama, Python inference) |
| `src/IdentityServer` | Duende IdentityServer issuing the JWT tokens the Backend requires |
| `src/PythonInference` | FastAPI + transformers local inference service |

Storage: PostgreSQL (relational), Qdrant (vector), Azure Blob (documents), Redis (pub/sub).

## API

The Backend HTTP endpoints, authentication, an end-to-end workflow, and test cases are documented
in [`docs/postman/API.md`](docs/postman/API.md). An importable Postman collection (with token
capture and test scripts) lives alongside it at
[`docs/postman/archer_chatbot.postman_collection.json`](docs/postman/archer_chatbot.postman_collection.json).

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dot.net/download) (Aspire 13 ships as NuGet packages — no workload install needed)
- [Docker Desktop](https://docs.docker.com/engine/install/), started (hosts Postgres, Qdrant, Redis, Azurite, and Ollama)
- [Python 3.12](https://www.python.org/downloads/) for the local inference service
- (Optional) An Nvidia GPU to accelerate Ollama — enable it by uncommenting `.WithGPUSupport()` in `src/AppHost/Program.cs`. Without a GPU, Ollama runs on the CPU.

#### Install Python requirements

From the Terminal, at the root of the cloned repo, run:

```powershell
pip install -r src/PythonInference/requirements.txt
```

**Note:** If the above command doesn't work on Windows, use the following command:

```powershell
py -m pip install -r src/PythonInference/requirements.txt
```

### Running the solution

> [!WARNING]
> Remember to ensure that Docker is started.

* (Windows only) Run the application from Visual Studio:
  - Open the `eShopSupport.slnx` file in Visual Studio
  - Ensure that `AppHost` is your startup project
  - Hit Ctrl-F5 to launch .NET Aspire

* Or open `eShopSupport.slnx` in JetBrains Rider / IntelliJ IDEA and run the `AppHost`
  configuration. The IDE's `.idea/` metadata folder is Git-ignored, so it won't be committed.

* Or run the application from your terminal:

  ```powershell
  dotnet run --project src/AppHost
  ```

  then look for lines like this in the console output in order to find the URL to open the Aspire dashboard:

  ```sh
  Login to the dashboard at: http://localhost:17191/login?t=uniquelogincodeforyou
  ```

> You may need to install ASP.NET Core HTTPS development certificates first, and then close all browser tabs. Learn more at https://aka.ms/aspnet/https-trust-dev-cert

# Contributing

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

# Sample data

Pre-chunked, pre-embedded business data lives in `seeddata/dev` (products, categories, customers,
tickets, and manual chunks) and is imported into PostgreSQL and Qdrant on Backend startup, giving
the chatbot business content to answer about. All names and content are fictional. The raw PDF
manuals and the synthetic data generator from the original sample have been removed; the manual
search runs on the embedded chunks in `manual-chunks.json`.
