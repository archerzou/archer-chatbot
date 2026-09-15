# Backend API reference (Postman)

This document lists every HTTP endpoint exposed by `src/Backend`, how to authenticate, a
suggested end-to-end workflow, and concrete test cases. An importable Postman collection lives
next to this file: [`archer_chatbot.postman_collection.json`](./archer_chatbot.postman_collection.json).

## Base URLs

Ports are assigned by .NET Aspire at runtime, so the reliable way to find the Backend URL is the
**Aspire dashboard** (`https://localhost:17191`) → the `backend` resource → its endpoint.

When the Backend is run **standalone** (`dotnet run --project src/Backend`) it uses the fixed dev
ports from `launchSettings.json`:

| Service | URL |
| --- | --- |
| Backend (http / https) | `http://localhost:5165` / `https://localhost:7223` |
| IdentityServer | `https://localhost:7275` |

The collection uses variables so you only set the URLs once: `baseUrl`, `identityUrl`.

## Authentication

All endpoints are protected. Authorization has two policies:

| Policy | Requirement | Applies to |
| --- | --- | --- |
| `StaffApi` (fallback — the default for any endpoint) | JWT with `role = staff` | all `/tickets*`, `/api/ticket*`, `/api/assistant/*`, `/manual`, `/api/categories`, `/api/products` |
| `CustomerApi` | any authenticated user that is **not** staff (must carry a numeric `sub` claim = customer id) | all `/customer/*` and `/api/customer/*` |

### Getting a staff token (recommended for Postman)

The `dev-and-test-tools` client uses the **client-credentials** grant and is pre-seeded with the
`role=staff` claim — no interactive login, so it drops straight into Postman:

```
POST {{identityUrl}}/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id=dev-and-test-tools
client_secret=dev-and-test-tools-secret
scope=staff-api
```

The response's `access_token` is used as `Authorization: Bearer {{token}}` on staff requests.
The collection's **Auth → Get staff token** request captures it into the `token` variable
automatically.

### Getting a customer token

Customer endpoints need a non-staff user with a numeric `sub` claim. Those are the seeded test
users (`src/IdentityServer/Pages/TestUsers.cs`): **alice / alice** (`sub=10000`, customer) and
**bob / bob** (`sub=10001`, staff). Only `alice` works for customer endpoints (`bob` is staff and
is rejected by `GetRequiredCustomerId`). alice authenticates via the OIDC **authorization-code**
flow (client `customer-webui`), which is interactive — configure it under Postman's
*Authorization → OAuth 2.0* if you need to exercise the customer surface. The staff client above
covers everything else.

## Endpoints

Enums serialize as **integers** in these DTOs:
`TicketStatus` → `Open=0, Closed=1`; `TicketType` → `Question=0, Idea=1, Complaint=2, Returns=3`.

### Staff (role = staff)

| # | Method | Path | Body | Purpose |
| --- | --- | --- | --- | --- |
| 1 | POST | `/tickets` | `ListTicketsRequest` | List / filter / sort / page tickets |
| 2 | GET | `/tickets/{ticketId}` | – | Full ticket detail incl. messages |
| 3 | PUT | `/api/ticket/{ticketId}` | `UpdateTicketDetailsRequest` | Change product/type/status; publishes a Redis `ticket:{id}` event |
| 4 | POST | `/api/ticket/{ticketId}/message` | `SendTicketMessageRequest` | Staff reply on a ticket |
| 5 | POST | `/api/assistant/chat` | `AssistantChatRequest` | Streaming AI assistant (see note) |
| 6 | GET | `/manual?file={name}` | – | Download a product-manual PDF (404 if missing) |
| 7 | GET | `/api/categories?searchText=` or `?ids=1,2` | – | Semantic/prefix category search |
| 8 | GET | `/api/products?searchText=` | – | Semantic product search |

### Customer (authenticated, non-staff)

| # | Method | Path | Body | Purpose |
| --- | --- | --- | --- | --- |
| 9 | GET | `/customer/tickets` | – | Caller's own tickets |
| 10 | GET | `/customer/tickets/{ticketId}` | – | One of the caller's tickets (404 if not theirs) |
| 11 | POST | `/customer/tickets/create` | `CreateTicketRequest` | Open a ticket; type auto-classified by the Python model |
| 12 | POST | `/api/customer/ticket/{ticketId}/message` | `SendTicketMessageRequest` | Customer reply (404 if not their ticket) |
| 13 | PUT | `/api/customer/ticket/{ticketId}/close` | – | Close the caller's ticket |
| 14 | GET | `/api/customer/products?searchText=` | – | Product search for the storefront |

### Request body shapes

```jsonc
// ListTicketsRequest  (all filters optional; MaxResults must be <= 100)
{ "filterByStatus": 0, "filterByCategoryIds": [1,2], "filterByCustomerId": null,
  "startIndex": 0, "maxResults": 20, "sortBy": "TicketId", "sortAscending": false }
// sortBy is one of: TicketId | CustomerFullName | NumMessages | CustomerSatisfaction

// UpdateTicketDetailsRequest
{ "productId": 1, "ticketType": 0, "ticketStatus": 0 }

// SendTicketMessageRequest
{ "text": "Thanks, that resolved it." }

// CreateTicketRequest  (productName pattern: "Model (Brand)", or null)
{ "productName": "Waterproof Jacket (AdventureWorks)", "message": "How do I clean this?" }

// AssistantChatRequest
{ "productId": 1, "customerName": "Alice Smith", "ticketSummary": "Zipper stuck",
  "ticketLastCustomerMessage": "The zipper won't move",
  "messages": [ { "isAssistant": false, "text": "How do I unstick the zipper?" } ] }
```

> **Assistant endpoint note:** `/api/assistant/chat` streams a custom NDJSON-ish array (it opens
> with `[null`, then appends `,\n<item>` chunks, and closes with `]`). Each item is an
> `AssistantChatReplyItem` with a `type` (`AnswerChunk=0, Search=1, SearchResult=2,
> IsAddressedToCustomer=3`). Postman shows the raw stream; it is not standard JSON until the final
> `]` arrives. It also requires a running LLM (Ollama) and seeded manuals.

## Suggested workflow (staff happy path)

1. **Auth → Get staff token** — populates `{{token}}`.
2. **POST `/tickets`** with `{ "startIndex":0, "maxResults":20, "sortBy":"TicketId", "sortAscending":false }` — grab a `ticketId` from the results.
3. **GET `/tickets/{ticketId}`** — inspect the ticket and its message thread.
4. **GET `/api/products?searchText=jacket`** — find a `productId` to attach.
5. **PUT `/api/ticket/{ticketId}`** — set product/type/status (e.g. mark `ticketStatus:1` = Closed).
6. **POST `/api/ticket/{ticketId}/message`** — post a staff reply.
7. **GET `/tickets/{ticketId}`** — confirm the new message and updated status are persisted.
8. *(optional)* **POST `/api/assistant/chat`** — ask the assistant a product question (needs Ollama + seed data).

## Test cases

| ID | Endpoint | Setup / Input | Expected |
| --- | --- | --- | --- |
| TC-01 | POST `/tickets` (no token) | omit `Authorization` | `401 Unauthorized` |
| TC-02 | Auth token | valid client creds | `200`, JSON has non-empty `access_token`, `token_type: Bearer` |
| TC-03 | POST `/tickets` | `maxResults:20` | `200`; body has `items[]`, `totalCount`, `totalOpenCount`, `totalClosedCount`; `items.length <= 20` |
| TC-04 | POST `/tickets` | `maxResults:101` | `400 Bad Request` (`"maxResults must be 100 or less"`) |
| TC-05 | POST `/tickets` | `sortBy:"NotAField"` | `400 Bad Request` (`"Invalid sortBy value"`) |
| TC-06 | GET `/tickets/{id}` | existing id | `200`; `ticketId` matches; `messages[]` present |
| TC-07 | GET `/tickets/{id}` | id `999999999` | `404 Not Found` |
| TC-08 | PUT `/api/ticket/{id}` | `{productId:1,ticketType:0,ticketStatus:1}` | `200`; follow-up GET shows `ticketStatus:1` |
| TC-09 | PUT `/api/ticket/{id}` | id `999999999` | `404 Not Found` |
| TC-10 | POST `/api/ticket/{id}/message` | `{text:"hi"}` | `200`; follow-up GET shows the appended message |
| TC-11 | GET `/api/products?searchText=jacket` | – | `200`; array of `{productId,brand,model}` |
| TC-12 | GET `/api/categories?searchText=cli` | – | `200`; array of `{categoryId,name}` |
| TC-13 | GET `/manual?file=missing.pdf` | – | `404 Not Found` |
| TC-14 | GET `/customer/tickets` | staff token | `500`/error — staff is rejected by `GetRequiredCustomerId` (use a customer token) |

The Postman collection encodes TC-02, TC-03, TC-04, TC-06, TC-07, TC-08, and TC-10 as executable
test scripts so you can run the whole folder with the Collection Runner.
