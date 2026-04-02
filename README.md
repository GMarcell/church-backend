# Church Backend

Backend API for church management features built with NestJS and Prisma.

## Stack

- NestJS
- Prisma
- PostgreSQL
- TypeScript
- Docker

## Features

- Authentication
- User management
- Branch management
- Region management
- Region coordinator assignment
- Family management
- Member management
- Attendance management
- Health check endpoint

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL database

## Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/DATABASE?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
PORT=3000
JWT_SECRET="change-me"
```

Notes:

- `DATABASE_URL` is the main Prisma connection string.
- `DIRECT_URL` is used by Prisma for direct database access.
- `PORT` defaults to `3000` if not provided.

## Install Dependencies

```bash
npm install
```

## Prisma Setup

Generate the Prisma client:

```bash
npx prisma generate
```

If you are using migrations, run:

```bash
npx prisma migrate deploy
```

For local development with schema changes, you can use:

```bash
npx prisma migrate dev
```

## Run The Project

Development mode:

```bash
npm run start:dev
```

Standard mode:

```bash
npm run start
```

Production mode:

```bash
npm run build
npm run start:prod
```

The app listens on:

- `0.0.0.0`
- `process.env.PORT` or `3000`

## API Base Path

Most routes use the `/api` prefix.

Examples:

- `GET /api`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/member-login`
- `GET /api/users`
- `GET /api/v1/regions`
- `PATCH /api/v1/regions/:id/coordinator`

## Coordinator Role

The backend supports assigning a region coordinator from an existing `Member` in that same region.

Current behavior:

- Region responses include a `coordinator` field on `GET /api/v1/regions` and `GET /api/v1/regions/:id`
- Region coordinator assignment is available through `PATCH /api/v1/regions/:id/coordinator`
- The selected coordinator must be a member whose family belongs to that region
- Members who are assigned as region coordinators can edit family and member data inside their own region

Example assign request:

```http
PATCH /api/v1/regions/:id/coordinator
Content-Type: application/json

{
  "memberId": "member-id"
}
```

To clear a coordinator from a region:

```json
{
  "memberId": null
}
```

## Health Check

Health check is available without the `/api` prefix:

```http
GET /health
```

Example:

```bash
curl http://localhost:3000/health
```

## Seed The Database

This project includes a Prisma seed file at [prisma/seed.ts](/home/admin-ubuntu/grand/church-sytem/church-backend/prisma/seed.ts).

Run the seed command with:

```bash
npx prisma db seed
```

What the seed currently creates:

- Branches
- Regions
- Families
- Members
- Attendance records
- Users

Seeded user accounts:

- `admin@example.com` / `admin123`
- `staff@example.com` / `staff123`
- `finance@example.com` / `finance123`
- `coordinator.regiona@example.com` / `coordinator123`

Important:

- The seed clears existing data first using `deleteMany()`.
- Run it only if you are okay with replacing current seedable data.

## Build And Run With Docker

Build the image:

```bash
docker build -t church-backend .
```

Run the container:

```bash
docker run --env-file .env -p 3000:3000 church-backend
```

## Railway Notes

- Railway should provide `PORT` automatically.
- The app already listens on the Railway-assigned port.
- Make sure `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET` are configured in Railway variables.
- If the app deploys but returns `502`, check the runtime logs for database connection failures during Prisma startup.

## Useful Commands

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
npm run test:cov
```

## Project Structure

```text
src/
  auth/
  attendance/
  branch/
  family/
  member/
  prisma/
  region/
  user/
prisma/
  schema.prisma
  seed.ts
```

## Postman

A Postman collection is available in:

[postman/church-backend.postman_collection.json](/home/admin-ubuntu/grand/church-sytem/church-backend/postman/church-backend.postman_collection.json)

The collection includes:

- Member login and admin login examples
- Region coordinator assignment and clear requests
- Requests for selecting a region coordinator from an existing member

## Troubleshooting

`nest: not found`

- Install dev dependencies before building.
- In Docker, the build stage must include dev dependencies.

`Cannot find module 'class-validator'`

- Run `npm install`.
- Make sure `class-validator` and `class-transformer` exist in `package.json`.

`PrismaClientInitializationError` or database unreachable

- Verify `DATABASE_URL` and `DIRECT_URL`.
- Confirm the PostgreSQL instance is reachable from your runtime environment.

`Application failed to respond` on Railway

- Make sure you are calling the correct route, usually under `/api`.
- Check `/health` first.
- Check Railway logs for Prisma connection failures during startup.
