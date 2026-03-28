# ◈ TaskFlow — Scalable REST API with JWT Auth & RBAC

A production-ready full-stack application featuring a Node.js/Express REST API with JWT authentication, role-based access control, and a React frontend.

---

## 🗂 Project Structure

```
taskflow/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/           # DB & Swagger config
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, error, validation
│   │   ├── models/           # Sequelize ORM models
│   │   ├── routes/           # Versioned API routes
│   │   ├── utils/            # Logger, response helpers
│   │   ├── validators/       # express-validator chains
│   │   ├── app.js            # Express app setup
│   │   └── server.js         # Entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── components/       # Layout
│   │   ├── context/          # AuthContext
│   │   ├── pages/            # Login, Register, Dashboard, Tasks, Admin
│   │   └── utils/            # Axios API client
│   ├── index.html
│   └── vite.config.js
├── docker-compose.yml
└── SCALABILITY.md
```

---

## ✅ Features

### Backend
- **JWT Authentication** — access + refresh token pair, auto-refresh interceptor
- **Role-Based Access Control** — `user` / `admin` roles with middleware guards
- **CRUD API for Tasks** — create, read, update, delete with filtering, search, pagination, sorting
- **Admin API** — list users, toggle active status, change roles, platform stats
- **API Versioning** — all routes under `/api/v1/`
- **Validation** — `express-validator` chains with descriptive error messages
- **Input Sanitization** — `.escape()`, `.trim()`, `.normalizeEmail()`
- **Error Handling** — centralised error middleware, Sequelize/JWT error mapping
- **Rate Limiting** — global (100 req/15min) + strict auth limiter (20 req/15min)
- **Security** — `helmet`, CORS allowlist, bcrypt password hashing (salt rounds: 12)
- **Logging** — `winston` with file transport (error.log + combined.log)
- **Swagger Docs** — auto-generated from JSDoc at `/api/v1/docs`
- **Health Check** — `GET /health`

### Frontend
- React 18 + React Router v6
- Protected routes (auth guard + admin guard)
- JWT interceptor with silent refresh
- Dashboard with task & platform stats
- Full task CRUD with modal form
- Admin user management table (toggle active, promote/demote)
- Success/error feedback on all actions

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- (Optional) Redis 7+, Docker

---

### Option A — Docker Compose (recommended)

```bash
# Clone the repo
git clone https://github.com/yourname/taskflow.git
cd taskflow

# Start everything (Postgres + Redis + Backend + Frontend)
docker-compose up --build
```

| Service  | URL                              |
|----------|----------------------------------|
| Frontend | http://localhost:3000            |
| Backend  | http://localhost:5000            |
| Swagger  | http://localhost:5000/api/v1/docs |

---

### Option B — Manual Setup

#### 1. Database

```sql
-- In psql
CREATE DATABASE taskflow_db;
```

#### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secrets

npm install
npm run dev
```

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 API Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <accessToken>
```

### Auth Flow

```
POST /api/v1/auth/register  →  { user, accessToken, refreshToken }
POST /api/v1/auth/login     →  { user, accessToken, refreshToken }
POST /api/v1/auth/refresh   →  { accessToken, refreshToken }
POST /api/v1/auth/logout    →  (invalidates refresh token)
GET  /api/v1/auth/me        →  current user profile
PUT  /api/v1/auth/change-password
```

---

## 📋 API Endpoints

### Tasks (Private)

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/api/v1/tasks`       | List tasks (paginated, filterable) |
| POST   | `/api/v1/tasks`       | Create task                        |
| GET    | `/api/v1/tasks/stats` | Task statistics                    |
| GET    | `/api/v1/tasks/:id`   | Get task by ID                     |
| PUT    | `/api/v1/tasks/:id`   | Update task                        |
| DELETE | `/api/v1/tasks/:id`   | Delete task                        |

**Query params for `GET /tasks`:**
`page`, `limit`, `status`, `priority`, `search`, `sortBy`, `order`

### Admin (Admin only)

| Method | Endpoint                              | Description           |
|--------|---------------------------------------|-----------------------|
| GET    | `/api/v1/admin/stats`                 | Platform statistics   |
| GET    | `/api/v1/admin/users`                 | List all users        |
| PATCH  | `/api/v1/admin/users/:id/toggle-active` | Activate/deactivate |
| PATCH  | `/api/v1/admin/users/:id/role`        | Update user role      |

---

## 🗄 Database Schema

### `users`
| Column        | Type         | Notes                  |
|---------------|--------------|------------------------|
| id            | UUID (PK)    | Auto-generated         |
| name          | VARCHAR(100) | Required               |
| email         | VARCHAR(255) | Unique                 |
| password      | VARCHAR(255) | bcrypt hashed          |
| role          | ENUM         | `user` / `admin`       |
| is_active     | BOOLEAN      | Default true           |
| last_login    | TIMESTAMP    | Nullable               |
| refresh_token | TEXT         | Nullable               |
| created_at    | TIMESTAMP    |                        |
| updated_at    | TIMESTAMP    |                        |

### `tasks`
| Column      | Type         | Notes                                  |
|-------------|--------------|----------------------------------------|
| id          | UUID (PK)    | Auto-generated                         |
| title       | VARCHAR(200) | Required                               |
| description | TEXT         | Nullable                               |
| status      | ENUM         | `todo`, `in_progress`, `done`, `archived` |
| priority    | ENUM         | `low`, `medium`, `high`, `critical`    |
| due_date    | DATEONLY     | Nullable                               |
| tags        | ARRAY(TEXT)  | Default `[]`                           |
| user_id     | UUID (FK)    | References `users.id`, CASCADE delete  |
| created_at  | TIMESTAMP    |                                        |
| updated_at  | TIMESTAMP    |                                        |

**Indexes:** `user_id`, `status`, `priority`, `due_date`

---

## 🔒 Security Practices

| Practice               | Implementation                            |
|------------------------|-------------------------------------------|
| Password hashing       | bcrypt, salt rounds = 12                  |
| JWT storage            | Tokens in localStorage; refresh invalidated on logout |
| Token expiry           | Access: 7d · Refresh: 30d                 |
| Input sanitisation     | escape, trim, normalizeEmail              |
| Rate limiting          | Global 100/15min · Auth 20/15min          |
| HTTP security headers  | helmet (CSP, HSTS, X-Frame-Options, etc.) |
| CORS                   | Allowlist from `.env`                     |
| Payload size limit     | 10kb via `express.json`                   |
| SQL injection          | Prevented by Sequelize parameterised queries |

---

## 📚 API Documentation

Swagger UI is available at:
```
http://localhost:5000/api/v1/docs
```

Raw OpenAPI JSON:
```
http://localhost:5000/api/v1/docs.json
```

A Postman collection (`TaskFlow.postman_collection.json`) is included in the repo root.

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

---

## 📦 Environment Variables

See `backend/.env.example` for all variables. Key ones:

```env
JWT_SECRET=<min 32 character random string>
JWT_REFRESH_SECRET=<different min 32 character random string>
DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 👤 Author

Built as part of the PrimeTrade Backend Developer Internship Assignment.
