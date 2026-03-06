# DevCollab - AI-Powered Bug Tracking & Team Collaboration Platform

A full-stack **MERN** (MongoDB, Express, React, Node.js) bug tracking application with **AI-powered triage**, **real-time collaboration**, **Kanban boards**, and **role-based access control**.

---

## Features

- **Bug Tracking** — Create, update, and manage bugs with list and Kanban (drag-and-drop) views
- **AI Triage** — Grok AI automatically analyzes bugs and suggests priority/severity
- **Real-time Updates** — Socket.IO powered live notifications, activity feed, and bug state sync
- **Project Management** — Organize bugs by projects, manage team members with role-based access
- **Dashboard & Analytics** — Visual charts, statistics, and trends with Recharts
- **GitHub Webhooks** — Auto-create bugs from GitHub issues
- **Authentication** — JWT-based auth with access/refresh tokens and cookie storage
- **Role-Based Access** — Admin, Developer, Reporter roles with granular permissions
- **Docker Ready** — One-command deployment with Docker Compose

---

## Tech Stack

| Layer              | Technology                                    |
| ------------------ | --------------------------------------------- |
| **Frontend**       | React 18, Vite, Tailwind CSS                  |
| **State**          | Redux Toolkit, RTK Query                      |
| **UI**             | Lucide React (icons), dnd-kit (drag & drop)   |
| **Routing**        | React Router v6                               |
| **Real-time**      | Socket.IO (client + server)                   |
| **Backend**        | Express.js, Node.js                           |
| **Database**       | MongoDB, Mongoose ODM                         |
| **Auth**           | JWT (access + refresh tokens), bcryptjs        |
| **AI**             | Grok API via OpenAI SDK (xAI)                 |
| **Validation**     | express-validator                             |
| **Deployment**     | Docker, Docker Compose                        |

---

## Project Structure

```
devcollab1/
├── package.json                      # Workspace root (npm workspaces)
├── Dockerfile                        # Multi-stage Docker build
├── docker-compose.yml                # MongoDB + app containers
│
├── client/                           # React Frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx                  # App entry point
│       ├── app/
│       │   ├── store.js              # Redux store
│       │   ├── rootReducer.js        # Root reducer
│       │   ├── api/baseApi.js        # RTK Query base API
│       │   └── providers/AppProvider.jsx
│       ├── features/
│       │   ├── auth/                 # Login, Register, JWT, Permissions
│       │   ├── bugs/                 # Bug CRUD, Kanban, Real-time
│       │   ├── projects/             # Project CRUD, Members
│       │   ├── dashboard/            # Analytics, Activity Feed
│       │   ├── notifications/        # Real-time notifications
│       │   ├── ai-triage/            # AI bug analysis panel
│       │   └── landing/              # Public landing page
│       ├── routes/                   # AppRoutes, ProtectedRoute
│       ├── services/                 # Axios instance, API config
│       ├── shared/components/        # Layout, Navbar, NotificationBell
│       └── styles/global.css         # Tailwind + base styles
│
└── server/                           # Express Backend
    ├── server.js                     # HTTP + Socket.IO startup
    └── src/
        ├── app.js                    # Express app, middleware, routes
        ├── config/
        │   ├── db.js                 # MongoDB connection
        │   └── env.js               # Environment config
        ├── middlewares/
        │   ├── auth.middleware.js    # JWT verification
        │   ├── error.middleware.js   # Global error handler
        │   ├── rate-limit.middleware.js
        │   ├── socket.middleware.js  # Socket.IO event handlers
        │   └── validate.middleware.js
        ├── modules/
        │   ├── ai/ai.service.js     # Grok AI integration
        │   ├── auth/                # Auth controller, routes, service
        │   ├── bugs/                # Bug CRUD, analytics, webhooks
        │   ├── projects/            # Project CRUD, membership
        │   └── users/               # User model, controller, routes
        └── utils/
            ├── ApiError.js          # Custom error class
            ├── asyncHandler.js      # Async route wrapper
            └── logger.js            # Logging utility
```

---

## Prerequisites

- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** v9+

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Darshan-dev57/BMSCE-XCEL-TS100.git
cd BMSCE-XCEL-TS100/code-red
```

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for both `client/` and `server/` workspaces.

### 3. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Required
MONGO_URI=mongodb://localhost:27017/devcollab
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
CLIENT_ORIGIN=http://localhost:5173

# Optional
PORT=5000
GROK_API_KEY=your_xai_api_key          # For AI triage (get from https://console.x.ai)
GITHUB_WEBHOOK_SECRET=your_secret       # For GitHub webhook integration
```

### 4. Start Development Server

```bash
npm run dev
```

This concurrently starts:
- **Backend** → `http://localhost:5000`
- **Frontend** → `http://localhost:5173`

### 5. Build for Production

```bash
npm run build    # Builds React frontend
npm start        # Starts Express serving the built frontend
```

---

## Docker Deployment

```bash
# Build and start everything
docker-compose up --build

# Access the app at http://localhost:5000
```

---

## API Endpoints

| Method | Endpoint                       | Description              | Auth |
| ------ | ------------------------------ | ------------------------ | ---- |
| POST   | `/api/auth/register`           | Register new user        | No   |
| POST   | `/api/auth/login`              | Login                    | No   |
| POST   | `/api/auth/logout`             | Logout                   | Yes  |
| POST   | `/api/auth/refresh`            | Refresh access token     | Yes  |
| GET    | `/api/projects`                | List projects            | Yes  |
| POST   | `/api/projects`                | Create project           | Yes  |
| GET    | `/api/projects/:id`            | Get project details      | Yes  |
| PUT    | `/api/projects/:id`            | Update project           | Yes  |
| DELETE | `/api/projects/:id`            | Delete project           | Yes  |
| POST   | `/api/projects/:id/members`    | Add members to project   | Yes  |
| GET    | `/api/bugs`                    | List bugs (by project)   | Yes  |
| POST   | `/api/bugs`                    | Create bug               | Yes  |
| GET    | `/api/bugs/:id`                | Get bug details          | Yes  |
| PUT    | `/api/bugs/:id`                | Update bug               | Yes  |
| DELETE | `/api/bugs/:id`                | Delete bug               | Yes  |
| GET    | `/api/analytics/overview`      | Bug analytics overview   | Yes  |
| GET    | `/api/users`                   | List users               | Yes  |
| POST   | `/api/webhooks/github`         | GitHub webhook receiver  | No   |

---

## Roles & Permissions

| Role         | Capabilities                                                  |
| ------------ | ------------------------------------------------------------- |
| **Admin**    | Full access — manage projects, bugs, members, settings        |
| **Developer**| Create/update bugs, manage assigned bugs, view analytics      |
| **Reporter** | Report bugs, view project bugs, comment                       |

---

## Real-time Features

The app uses Socket.IO for:
- **Bug Updates** — Live sync when bugs are created, updated, or moved on Kanban
- **Notifications** — Instant alerts for bug assignments and status changes
- **Activity Feed** — Real-time project activity stream on the dashboard

---

## Environment Variables Reference

| Variable                  | Required | Default                           | Description                      |
| ------------------------- | -------- | --------------------------------- | -------------------------------- |
| `MONGO_URI`               | Yes      | —                                 | MongoDB connection string        |
| `JWT_ACCESS_SECRET`       | Yes      | `dev_access_secret`               | JWT access token secret          |
| `JWT_REFRESH_SECRET`      | Yes      | `dev_refresh_secret`              | JWT refresh token secret         |
| `CLIENT_ORIGIN`           | Yes      | `http://localhost:5173`           | Frontend URL for CORS            |
| `PORT`                    | No       | `5000`                            | Server port                      |
| `GROK_API_KEY`            | No       | —                                 | xAI API key for AI triage        |
| `GITHUB_WEBHOOK_SECRET`   | No       | —                                 | GitHub webhook validation secret |
| `AUTH_COOKIE_CROSS_SITE`  | No       | `false`                           | Enable cross-site cookies        |
| `AUTH_COOKIE_SAME_SITE`   | No       | —                                 | Cookie SameSite attribute        |
| `AUTH_COOKIE_SECURE`      | No       | —                                 | Cookie Secure flag               |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).
