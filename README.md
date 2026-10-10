# Lamar ACM Official Website

The official website and member platform for the ACM student chapter at Lamar University. Live at **[lamaracm.org](https://lamaracm.org)**.

Members sign in with Discord, pay dues through Square, and get their Discord member role assigned automatically. Officers manage events, announcements, coding challenges, and support tickets from an admin dashboard.

## Features

- **Discord OAuth sign-in** with JWT access and refresh tokens
- **Paid memberships** via Square hosted checkout; HMAC-verified webhooks activate the membership and assign the Discord role
- **Discord role sync**: existing members who already hold the role are recognized on login
- **Events** with a calendar view and RSVPs
- **Announcements** and **email blasts** (Resend)
- **Coding challenges** with member submissions and officer review
- **Support tickets** with threaded messages
- **Admin dashboard**: user and membership management, role changes, chapter stats
- **Bot protection** with Cloudflare Turnstile verification

## Tech Stack

| Layer | Tools |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy (async), Alembic, Pydantic |
| Database | PostgreSQL (asyncpg); SQLite for local development |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router |
| Integrations | Discord API (OAuth + bot), Square, Resend, Cloudflare Turnstile |
| Hosting | Netlify (frontend) |

## Architecture

```
React (Vite)  ──►  FastAPI  ──►  PostgreSQL
                     │
                     ├── Discord  (OAuth login, role assignment)
                     ├── Square   (checkout + signed webhooks)
                     └── Resend   (transactional email)
```

**Auth flow:** The user signs in with Discord. The backend exchanges the OAuth code, creates or updates the user, syncs Discord roles, and issues a short-lived access token and a longer-lived refresh token. Protected routes use FastAPI dependencies (`get_current_user`, `require_active_member`, `require_admin`) for role-based access.

**Payment flow:** `POST /membership/checkout` creates a pending membership and a Square payment link. When the payment completes, Square calls `POST /membership/webhook`. The backend verifies the HMAC-SHA256 signature with a constant-time comparison, activates the membership for one year, assigns the Discord member role, and sends a confirmation email.

## Project Structure

```
app/
  core/        config, database session, JWT helpers, auth dependencies
  models/      SQLAlchemy models
  schemas/     Pydantic request/response schemas
  routers/     API routes (auth, membership, events, announcements,
               challenges, tickets, admin)
  services/    Discord, Square, and email integrations
migrations/    Alembic migrations
frontend/      React + TypeScript client
```

## Running Locally

**Backend**

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in your keys
alembic upgrade head
uvicorn app.main:app --reload
```

API docs are served at `http://localhost:8000/docs`.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

See `.env.example`. The app runs without Discord, Square, or Resend keys, but those features are disabled until they're set.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Signs access and refresh tokens |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | OAuth login |
| `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_MEMBER_ROLE_ID`, `DISCORD_VERIFIED_ROLE_ID` | Role assignment and sync |
| `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, `SQUARE_ENVIRONMENT` | Payments |
| `MEMBERSHIP_PRICE_CENTS` | Dues amount |
| `RESEND_API_KEY` | Email |
| `TURNSTILE_SECRET_KEY` | Bot verification |
| `FRONTEND_URL`, `BACKEND_URL` | Redirects, CORS, webhook URL |

## Author

Built by [Bilal Maqsood](https://bilalmaq.com), ACM chapter president.
