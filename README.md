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

echo "# Primetrade.ai" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/parthkavad54/Primetrade.ai.git
git push -u origin main