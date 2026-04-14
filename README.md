# Primetrade.ai Assignment

This repository is a full-stack starter for the backend developer assignment.

## Stack

- Backend: Express, TypeScript, MongoDB Atlas, MongoDB driver, JWT, Swagger UI
- Frontend: React, Vite, TypeScript

## Local Setup

1. Point the backend at MongoDB Atlas by setting `backend/.env`.

2. Install dependencies.

```bash
npm install
```

3. Seed MongoDB Atlas.

```bash
npm --workspace backend run seed
```

4. Start the apps.

```bash
npm run dev:backend
npm run dev:frontend
```

## Deploy On Vercel

1. Import this repository into Vercel.
2. Set the project root to the repository root.
3. Set these environment variables in Vercel:

```text
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB_NAME=primetrade
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1d
COOKIE_NAME=pt_access
CORS_ORIGIN=https://your-vercel-domain.vercel.app
BCRYPT_ROUNDS=12
ADMIN_SEED_EMAIL=admin@primetrade.ai
ADMIN_SEED_PASSWORD=Admin123!
```

4. Keep the default build command as `npm run build:frontend`.
5. The frontend will call the API on `/api/v1` in production.

If you want local frontend development, set `VITE_API_URL=http://localhost:4000` in a frontend env file.

## API

- Base path: `/api/v1`
- Swagger UI: `/docs`

## Deliverables Included

- Authentication with hashed passwords and JWT cookies
- Role-based task access for `user` and `admin`
- CRUD endpoints for tasks
- Basic frontend for auth and task management
- MongoDB Atlas seed data
- Postman collection stub
- Scalability note

## Next Steps

- Expand tests for auth and task flows
- Harden token refresh and CSRF protection if the app moves beyond the assignment scope