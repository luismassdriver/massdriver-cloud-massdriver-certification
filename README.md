# Massdriver Certification

A small Next.js app that runs the Massdriver certification quizzes: a **Developer** track and an **Ops / Platform** track, 20 multiple-choice questions each, pass at 16. Question order and answer order are shuffled every attempt, every miss shows its explanation, retries are immediate, and a pass issues a certificate with a public verification page and a PDF.

The app deploys to a Kubernetes cluster (EKS Fargate in the `citizens` org) through the Massdriver v2 bundle in [`massdriver/`](massdriver/).

## Stack

Next.js 16 (App Router, server actions) · Auth.js v5 (Google / GitHub OAuth, plus a passwordless dev login for staging) · Postgres via `pg` (tables created on first start) · `pdf-lib` for certificates.

## Local development

```sh
cp .env.example .env.local        # AUTH_DEV_LOGIN=true is on by default
docker compose up db -d           # Postgres on localhost:5432
npm install
npm run dev                       # http://localhost:3000
```

Or run the whole thing in containers with `docker compose up --build`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit tests for the question bank, shuffling and grading |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build (`output: standalone`) |

## Configuration

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `DATABASE_SSL` | no | `require` for RDS |
| `AUTH_SECRET` | yes | `openssl rand -base64 32` |
| `AUTH_URL` / `APP_URL` | yes | Public origin; used for OAuth callbacks and certificate links |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | no | Enables Google sign-in |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | no | Enables GitHub sign-in |
| `AUTH_DEV_LOGIN` | no | `true` enables passwordless login. Never in production. |

In Massdriver, all of these are set by the bundle: `DATABASE_URL` from the linked Postgres resource, `AUTH_SECRET` generated on first deploy, `AUTH_DEV_LOGIN` / `AUTH_URL` / OAuth credentials from params. When `public_url` is left empty the app uses the request host (the load balancer address) for links.

## Routes

| Route | Auth | Purpose |
| --- | --- | --- |
| `/` | – | Pick a track |
| `/signin` | – | OAuth buttons / dev login |
| `/quiz/[track]` | user | Intro + start |
| `/attempt/[id]` | owner | The quiz |
| `/attempt/[id]/result` | owner | Score, misses with explanations, retry, certificate links |
| `/cert/[id]` | – | Public verification page |
| `/cert/[id]/pdf` | – | Certificate PDF |
| `/me` | user | Certificates and attempt history |
| `/api/health` | – | 200 when the DB is reachable (used by the ALB) |

## Editing the question bank

Questions live in [`src/lib/questions.ts`](src/lib/questions.ts). Each has four options in canonical order, a `correct` index and a `rationale`. The unit tests enforce 20 per track, distinct options and a valid answer index. To make the quiz customer-specific, replace any question with one about that org's catalog, roles or naming conventions.

## CI / CD

`.github/workflows/ci.yml` lints, tests and builds on every push and PR. On pushes to `main` it also builds the image to `ghcr.io/<owner>/<repo>` (tags `latest` and the commit SHA) and publishes the bundle to Massdriver (`mass repository create` + `mass bundle publish`).

One-time setup: add the repository secret `MASSDRIVER_API_KEY` (a service-account key for the org; the org id defaults to `citizens`, override with the `MASSDRIVER_ORG_ID` repository variable), and after the first image push make the GHCR package public so the cluster can pull it without credentials. Deploying is then done from the Massdriver UI: see [`massdriver/README.md`](massdriver/README.md).
