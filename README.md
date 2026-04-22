# Spyne Marketing Activity Tracker

Multi-page React SPA with Express and PostgreSQL for weekly marketing activity visibility.

## Layout

- [`client/`](client/) — Vite + React + React Router
- [`server/`](server/) — Express API under `/api`
- [`scripts/seed.js`](scripts/seed.js) — Admin user (from env) and ISO week rows

## Local development

1. Create a PostgreSQL database and copy [`server/.env.example`](server/.env.example) to `server/.env`, then set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`.

2. Copy [`client/.env.example`](client/.env.example) to `client/.env` and set `VITE_API_URL` (default `http://localhost:4000`).

3. Install dependencies from the repo root:

```bash
npm install
```

4. Run migrations and seed:

```bash
npm run migrate
npm run seed
```

5. Start the API and the client in two terminals:

```bash
npm run dev:server
npm run dev:client
```

Open the app at `http://localhost:5173`. Sign in with the admin credentials you configured.

## JWT

Access tokens expire after **7 days**. Adjust in [`server/lib/jwt.js`](server/lib/jwt.js) if needed.

## Railway

- Create two services from this repo: **server** (Node, start `npm run start -w server` or `node server/index.js` with root directory the repo) and **client** (build `npm run build -w client`, serve `client/dist` with a static host or `vite preview`).
- Add a Railway **PostgreSQL** plugin and set `DATABASE_URL` on the server service.
- Set `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `CLIENT_ORIGIN` to your deployed frontend URL.
- Set **build-time** `VITE_API_URL` on the client service to the public API URL (e.g. `https://your-api.up.railway.app`).

The server enables CORS for `CLIENT_ORIGIN` (default `http://localhost:5173`).
