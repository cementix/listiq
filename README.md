This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Neon PostgreSQL

The workspace is linked to Neon project `royal-bar-26320381`, branch `production`.
`neon.ts` declares the infrastructure policy; Postgres is included by default.
Keep `.neon`, `.env`, and `.env.preview` out of Git.

```bash
npx neon@latest deploy
npx neon@latest env pull --branch preview --file .env.preview
npm run db:migrate
npm run build
npm start
```

`DATABASE_URL` is the pooled application connection. `DATABASE_URL_UNPOOLED`
is the direct connection used by Prisma migrations. The existing migrations enable
`pg_trgm` and create the search indexes. The app keeps Prisma and `pg`, with a
five-connection pool and the Vercel pool lifecycle helper.

Vercel runs `npm run vercel-build` (generate client, deploy migrations, build).
Set `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `SESSION_SECRET` in each Vercel
environment. Production must use the production branch URLs; Preview must use
the preview branch URLs. Configure the app's existing Cloudinary/provider/cron
secrets separately as needed. Neon CLI pulls local env files; it does not set
Vercel environment variables. Vercel account configuration still needs to be done
in the hosting project.

With the production server running locally, `npm run test:neon` checks `pg_trgm`,
submits the real registration form over HTTP, verifies the user and default list,
exercises Prisma create/read/update, and checks authenticated pages render database
content. It creates uniquely named temporary fixtures and deletes them afterward.
Use a matching database environment for the server and test. Set `SMOKE_BASE_URL`
to change the local URL. Production builds use Webpack because Turbopack's CSS
worker crashed on this Windows environment.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
