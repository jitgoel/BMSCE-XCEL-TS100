# One-Place Deployment (Single URL)

This setup deploys **frontend + backend + sockets** from one service and one domain.

## Recommended Platform

- Render Web Service (free tier supported)
- MongoDB Atlas free tier for database

## Why This Works

- Backend now serves `client/dist` in production.
- Client defaults to same-origin API and socket URLs in production.
- You get one URL for app + API + realtime sockets.

## 1) Prepare Database (MongoDB Atlas)

1. Create a free Atlas cluster.
2. Create DB user and allow network access (for testing, `0.0.0.0/0`; tighten later).
3. Copy connection string:
   - `mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`

## 2) Create Render Web Service

1. Push this repo to GitHub.
2. In Render: **New > Web Service**.
3. Connect repo.
4. Set:
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

## 3) Add Environment Variables (Render)

Set these in Render service environment:

- `NODE_ENV=production`
- `PORT=10000` (or leave unset; Render provides one)
- `MONGO_URI=<your atlas uri>`
- `JWT_ACCESS_SECRET=<long-random-secret>`
- `JWT_REFRESH_SECRET=<long-random-secret>`
- `CLIENT_ORIGIN=https://<your-render-domain>.onrender.com`
- `AUTH_COOKIE_CROSS_SITE=false`
- `AUTH_COOKIE_SAME_SITE=lax`
- `AUTH_COOKIE_SECURE=true`
- `GITHUB_WEBHOOK_SECRET=<optional-but-recommended>`
- `GROK_API_KEY=<optional; leave empty to use fallback triage>`

Notes:
- Keep `CLIENT_ORIGIN` exactly your deployed app URL.
- If frontend and backend are same URL (this guide), cookie cross-site should stay `false`.

## 4) Deploy and Verify

After deploy, test:

1. `GET /api/health` returns `{ status: "ok" ... }`
2. Open root `/` and verify landing page loads.
3. Register/login works.
4. Create project and add members.
5. Create bug and assign member.
6. Notification arrives for assigned member.

## 5) GitHub Webhook (Optional)

1. In GitHub repo: Settings > Webhooks > Add webhook.
2. Payload URL:
   - `https://<your-render-domain>.onrender.com/api/webhooks/github`
3. Content type: `application/json`
4. Secret: same as `GITHUB_WEBHOOK_SECRET`
5. Events: push events.

## 6) Local Development (unchanged)

Continue using:

- `npm run dev`

Local `.env` for client can stay:

- `VITE_API_URL=http://localhost:5000/api`
- `VITE_SOCKET_URL=http://localhost:5000`

## Free-Tier Limitations

- Service cold starts may delay first request.
- Atlas free tier has storage and performance limits.
- External AI free tiers can rate-limit.

The app remains functional with AI fallback if API key is omitted.
