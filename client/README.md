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

## Using the app

1) Launch and authenticate
- Open the app and go to `Login` or `Register`.
- Registration: enter a unique username to create an account.
- Login/Authorize: enter an existing username to receive a fresh token.

2) Join or create a list
- After login you’ll land on `Your Lists`.
- Join an existing list: paste an invite key into the input and click `Join`.
- Create a new list: enter a name and click `Create & Open`.
- Sharing: from the list view (`Home`), use `Copy invite key` to share the key with teammates.

3) Work with todos
- In the list (`Home`), add todos using the input at the top and `Add`.
- Update state using the dynamic buttons:
	- `To Be Done` / `In Progress` / `Mark Done` move items backward/forward through `TODO → ONGOING → DONE`.
- Delete items with `Delete`.

4) Realtime updates
- The client opens a realtime stream to the server for the active list.
- When anyone adds, updates, or deletes an item in the same list, your list will refresh automatically.

5) Switch lists
- Use `Join a different list` at the bottom of `Home` to return to `Your Lists`.

6) Logout
- Use `Logout` button in the top right hand corner to logout of the current account.

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
