# CX-classroom loader

This project is a PoC for a classroom loader using OCX data.

## Setup

We use:

- Next.js (with typescript)
- Postgresql (with prisma)
- Oauth2 for google login and APIs. The google app must have:
  - oauth access
  - gdrive api
  - classroom api

For setting up dev:

- run npm install
- create a `.env.local` with your settings and Google API creds
- create the db and load the schema:
  - `createdb ocx-classroom-dev`
  - `psql -d ocx-classroom-dev < data/schema.sql`
- generate the prisma client:
  - `npx prisma generate`
- run with `npm run dev`
- open [http://localhost:3000](http://localhost:3000)
