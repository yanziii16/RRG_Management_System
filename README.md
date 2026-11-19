# RRG Management System

A resort management system for cottage, room, guest and reservation records. This repository holds the backend API (Node.js, Express, PostgreSQL) and the frontend.

## Live links

| Part | Address |
|---|---|
| Backend (Render) | https://rrg-backend-anxc.onrender.com |
| Health check | https://rrg-backend-anxc.onrender.com/api/health |
| Frontend (Netlify or Vercel) | _link_ |

The health check returns exactly `{"status":"ok"}`. The Render free plan sleeps after about 15 minutes without requests, so the first request can take up to a minute.

## Team

| Name | Part |
|---|---|
| Diana Mae J. Oxina | Backend, database, deployment |
| Ashly Jana A. Quising | Frontend |

## Tech stack

- **Backend:** Node.js, Express, `pg`, Zod (validation), bcryptjs and JWT (login)
- **Database:** PostgreSQL (hosted on Render)
- **Tests:** Vitest and Supertest
- **CI:** GitHub Actions
- **Hosting:** Render (backend and database), Netlify or Vercel (frontend)

## Project structure

```
RRG_Management_System/
├── .github/workflows/ci.yml   CI: backend and frontend jobs
├── backend/
│   ├── db/schema.sql          database tables (safe to run again)
│   ├── src/
│   │   ├── app.js             Express app and routes
│   │   ├── server.js          starts the server
│   │   ├── config.js          environment settings
│   │   ├── db.js    
│   │   ├── schemas.js
│   │   ├── middleware/        auth, validation, error handling
│   │   ├── routes/            one file per resource
│   │   ├── services/          booking rules and settings
│   │   ├── utils/             dates, pricing, errors, SQL helpers
│   │   └── scripts/migrate.js applies db/schema.sql
│   └── tests/                 unit tests
└── frontend/                  the web app
```

## Run the backend locally

Requirements: Node.js 20 and a PostgreSQL database.

```bash
cd backend
npm install
```

Create `backend/.env` (this file is never committed):

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DBNAME
JWT_SECRET=a-long-random-string
CLIENT_URL=http://localhost:5173
```

Then create the tables and start the server:

```bash
npm run migrate
npm run dev
```

The API runs at `http://localhost:3000` (or the `PORT` you set).

## Environment variables

| Variable | What it is |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign login tokens |
| `CLIENT_URL` | The frontend address allowed by CORS (no trailing slash). `CORS_ORIGIN` also works |
| `NODE_ENV` | `production` on Render |
| `PORT` | Set by Render automatically |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the server for development |
| `npm start` | Start the server (used by Render) |
| `npm run migrate` | Create or update the database tables |
| `npm test` | Run the unit tests |

## API overview

All routes except `/api/health` and `/api/auth` need a login token: `Authorization: Bearer <token>`.

| Route | Who | What |
|---|---|---|
| `GET /api/health` | Anyone | Health check, no database |
| `POST /api/auth/login`, `GET /api/auth/me` | Anyone / logged in | Log in and see the current user |
| `/api/users` | Admin | Staff accounts |
| `/api/rates` | Admin | Entrance fees and rental prices |
| `/api/settings` | Admin | Maximum guests per swim session |
| `/api/cottages` | Staff (edit: admin) | Cottages and availability by date and session |
| `/api/rooms` | Staff (edit: admin) | Rooms and availability by dates |
| `/api/guest-counts` | Staff | Record walk-in guests, with category fees |
| `/api/guests` | Staff | Guest records and search |
| `/api/reservations` | Staff | Create, list, cancel, check in, check out, balance |

Payments, rentals, the dashboard and reports are in Part 3 of the backend.

### Business rules covered

- Double booking is refused with a `409` (the cottage or room row is locked while booking).
- Overnight stays: check-in 2:00 PM, check-out 12:00 NN the next day.
- Weekend prices apply to Saturday and Sunday nights when set.
- Guest counts can be split into adult, kid and senior or PWD.
- Cashiers cannot change rates, settings or users (`403`).

## Tests

The backend uses Vitest. The tests run without a database.

```bash
cd backend
npm test
```

| ID | What it checks |
|---|---|
| B-T1 to B-T5 | _list your five required backend tests here_ |
| B-T6 | Login with empty fields says each field is required |
| B-T7 | A protected route refuses a request with no token |
| B-T8 | CORS allows only the real frontend address |
| B-T9, B-T10 | Balance and payment rules (see `tests/payments.test.js`) |
| F-T1 to F-T3 | _frontend tests, added by the frontend partner_ |

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

- **backend job:** `npm ci` and `npm test` in `backend/`
- **frontend job:** added by the frontend partner

**Proof that CI catches a broken test:** _add the screenshot of the red check and the green check here._

## Deployment

1. **Database:** a PostgreSQL instance on Render (Singapore).
2. **Backend:** a Render web service with root directory `backend`, build command `npm install`, start command `npm start` and health check path `/api/health`.
3. **Environment variables** on Render: `DATABASE_URL` (internal URL), `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`.
4. **Tables:** `npm run migrate` was run once against the hosted database.
5. **Auto-Deploy:** set to _After CI Checks Pass_.

## Branch protection and workflow

`main` is protected by a ruleset:

- Changes enter only through a pull request with 1 approval
- Status checks must pass
- Force pushes and deletions are blocked

Work is done on branches such as `feature/...`, `fix/...` and `docs/...`, then merged by pull request after the partner approves.

## Diagrams

- Diagram 1: Deployment architecture _(add image or link)_
- Diagram 2: CI/CD pipeline _(add image or link)_

## Known limits

- The Render free plan sleeps when idle, and the free database has a time limit.
- Payments, rentals, the dashboard and reports are added in Part 3.
