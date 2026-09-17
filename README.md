# ERP Application

An ERP workflow application covering customer enquiries, quotations, sales orders, inventory reservation, and dispatch.

## Tech Stack

- Frontend: React 19, Vite, React Router, Axios, Tailwind CSS, Lucide React
- Backend: Node.js, Express, Prisma ORM
- Database: PostgreSQL 16
- Testing: Node.js built-in test runner
- Local infrastructure: Docker Compose

## Project Setup

### Prerequisites

- Node.js 18 or later
- npm
- Docker Desktop with Docker Compose

Install dependencies in both applications:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Database Setup

Start PostgreSQL from the project root:

```bash
docker compose up -d db
```

The database is available at `localhost:5432` with these local development values:

- Database: `erp_db`
- User: `erp`
- Password: `erp_password`

PostgreSQL data is persisted in the Docker volume `erp_pgdata`.

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```bash
cd backend
copy .env.example .env
```

On macOS/Linux, use `cp .env.example .env` instead. Set a strong value for `JWT_SECRET` outside local development.

Important variables:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://erp:erp_password@localhost:5432/erp_db?schema=public"
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=24h
```

## Migration and Seed Instructions

From the `backend` directory, generate the Prisma client and create the database tables:

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

The seed creates admin and sales users, sample products with inventory, and sample customers. It is safe to run again because existing seed records are preserved.

For a development migration workflow after changing `schema.prisma`:

```bash
npm run prisma:migrate -- --name describe-your-change
```

To apply already-created migrations in another environment:

```bash
npm run prisma:deploy
```

## Run the Backend

In one terminal:

```bash
cd backend
npm run dev
```

The API runs at `http://localhost:5000` and the health endpoint is `http://localhost:5000/api/health`.

## Run the Frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`. The Vite development server proxies `/api` requests to the backend.

## Run Tests

Start PostgreSQL, configure `backend/.env`, apply the schema, and seed the database first. Then run the backend workflow tests:

```bash
cd backend
npm test
```

To build and lint the frontend:

```bash
cd frontend
npm run build
npm run lint
```

## Test Login Credentials

These accounts are created by `backend/prisma/seed.js`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@erp.com` | `admin123` |
| Sales user | `sales@erp.com` | `sales123` |

Change these credentials and the JWT secret before using the application outside local development.