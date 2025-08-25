# TODO List Backend (Express + TypeScript)

A simple Node.js Express backend for a collaborative TODO list with mocked authentication. Designed to run locally and be used by an Electron client.

## Scripts

- `npm run dev` – Start in watch mode using ts-node-dev
- `npm run build` – Compile TypeScript to `dist/`
- `npm start` – Run compiled server from `dist`
- `npm test` – Run tests (Jest + Supertest via ts-jest)

## Requirements

- Node.js 18+

## Getting started

```bash
npm install
npm run dev
# Open http://localhost:4000/health
```

To build and run the compiled output:

```bash
npm run build
npm start
```

## HTTP API

Base URL: `http://localhost:4000`

### Authentication:
- Most endpoints require a JWT in `Authorization: Bearer <token>`.
- The SSE stream accepts the token as a query param: `?token=<token>` (useful for `EventSource`).

### Common models:
- List: `{ id: string; name: string; key: string }`
- Todo: `{ id: string; listId: string; title: string; state: 'TODO' | 'ONGOING' | 'DONE' }`

### Health
- GET `/health`
	- Returns 200 if the server is running.

### Auth
- POST `/auth/register`
	- Body: `{ username: string }`
	- Response: `{ token: string }`
- POST `/auth/authorize`
	- Body: `{ username: string }`
	- Response: `{ token: string }`

### Lists
- GET `/lists`
	- Headers: `Authorization: Bearer <token>`
	- Response: `List[]`
- POST `/lists`
	- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
	- Body: `{ name: string }`
	- Response: `List`
- GET `/lists/:listId/stream?token=<token>` (SSE)
	- Server-Sent Events stream.
	- Emits events: `todoCreated`, `todoUpdated`, `todoDeleted`.
	- Event payload is not required by the current client; clients typically refetch on these.

### Todos
- GET `/todos/:listId`
	- Headers: `Authorization: Bearer <token>`
	- Response: `Todo[]`
- POST `/todos/:listId`
	- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
	- Body: `{ title: string }`
	- Response: `Todo`
- POST `/todos/:listId/:todoId/transition`
	- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
	- Body: `{ transitionItem: 'next' | 'previous' }`
	- Response: updated `Todo`
- DELETE `/todos/:listId/:todoId`
	- Headers: `Authorization: Bearer <token>`
	- Response: `204 No Content`

### Examples

```bash
# Register and capture token
TOKEN=$(curl -s -X POST \
	-H 'Content-Type: application/json' \
	-d '{"username":"demo"}' \
	http://localhost:4000/auth/register | jq -r .token)

# Create a list
LIST=$(curl -s -X POST \
	-H "Authorization: Bearer $TOKEN" \
	-H 'Content-Type: application/json' \
	-d '{"name":"My List"}' \
	http://localhost:4000/lists)
LIST_ID=$(echo "$LIST" | jq -r .id)

# Add a todo
curl -s -X POST \
	-H "Authorization: Bearer $TOKEN" \
	-H 'Content-Type: application/json' \
	-d '{"title":"Task A"}' \
	"http://localhost:4000/todos/$LIST_ID"

# Get todos
curl -s -H "Authorization: Bearer $TOKEN" \
	"http://localhost:4000/todos/$LIST_ID"

# Transition a todo (forward)
TODO_ID='todo-1' # replace with a real id from the previous response
curl -s -X POST \
	-H "Authorization: Bearer $TOKEN" \
	-H 'Content-Type: application/json' \
	-d '{"transitionItem":"next"}' \
	"http://localhost:4000/todos/$LIST_ID/$TODO_ID/transition"
```

## Other notes

- File-based storage at `src/data/db.json` for simplicity.
- Mocked JWT auth via `/auth/register` and `/auth/authorize`.
- SSE (Server-Sent Events) stream at `GET /lists/:listId/stream` for live updates.
