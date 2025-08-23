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

## Notes

- File-based storage at `src/data/db.json` for simplicity.
- Mocked JWT auth via `/auth/register` and `/auth/authorize`.
- SSE stream at `GET /lists/:listId/stream` for live updates.
