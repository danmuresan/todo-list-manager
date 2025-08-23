# TODO List Client (Electron + React + TypeScript)

Minimal Electron client with a React renderer. This is the app you run to try the product.

## Prereqs
- Node.js 18+

## Install
```bash
cd server && npm install
cd ../client && npm install
```

## Run (dev)
Starts server + client watchers + Electron.
```bash
cd client
npm run dev
```
The API defaults to `http://localhost:4000`. Use the Login/Register pages to get a token and start adding TODOs.

## Build and run (no watchers)
```bash
cd client
npm run build
npm run electron
```

## Test & Lint
```bash
cd client
npm test
npm run lint
```

## Configure API host
Change `getDefaultConfig()` in `src/renderer/app-configs.ts` if your server isn’t on `http://localhost:4000`.

## Notes
- If the window doesn’t resize after login, ensure `window.electronAPI` is available (preload) and you’re calling `loginWindowCompleted()`.
