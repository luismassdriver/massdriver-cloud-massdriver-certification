import { Pool } from "pg";
import type { Answers, Layout } from "./quiz";
import type { Track } from "./questions";

declare global {
  var __mdcertPool: Pool | undefined;
  var __mdcertMigrated: Promise<void> | undefined;
}

export function pool(): Pool {
  if (!globalThis.__mdcertPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    globalThis.__mdcertPool = new Pool({
      connectionString,
      ssl:
        process.env.DATABASE_SSL === "require"
          ? { rejectUnauthorized: false }
          : undefined,
      max: 5,
    });
  }
  return globalThis.__mdcertPool;
}

const MIGRATIONS = `
create table if not exists users (
  id          text primary key,
  email       text unique not null,
  name        text,
  image       text,
  created_at  timestamptz not null default now()
);
create table if not exists attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null references users(id),
  track        text not null check (track in ('developer','ops')),
  layout       jsonb not null,
  answers      jsonb,
  score        int,
  passed       boolean,
  started_at   timestamptz not null default now(),
  submitted_at timestamptz
);
create index if not exists attempts_user_idx on attempts(user_id, started_at desc);
create table if not exists certificates (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references users(id),
  attempt_id uuid not null unique references attempts(id),
  track      text not null,
  issued_at  timestamptz not null default now()
);
`;

/** Idempotent, runs once per process. Fine for a single-schema app; swap for a migration tool if the schema grows. */
export function migrate(): Promise<void> {
  if (!globalThis.__mdcertMigrated) {
    globalThis.__mdcertMigrated = pool()
      .query(MIGRATIONS)
      .then(() => undefined)
      .catch((err) => {
        globalThis.__mdcertMigrated = undefined;
        throw err;
      });
  }
  return globalThis.__mdcertMigrated;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface Attempt {
  id: string;
  user_id: string;
  track: Track;
  layout: Layout;
  answers: Answers | null;
  score: number | null;
  passed: boolean | null;
  started_at: Date;
  submitted_at: Date | null;
}

export interface Certificate {
  id: string;
  user_id: string;
  attempt_id: string;
  track: Track;
  issued_at: Date;
}

export async function upsertUser(u: User): Promise<void> {
  await migrate();
  await pool().query(
    `insert into users (id, email, name, image) values ($1, $2, $3, $4)
     on conflict (email) do update set name = excluded.name, image = excluded.image`,
    [u.id, u.email.toLowerCase(), u.name, u.image],
  );
}

export async function userByEmail(email: string): Promise<User | null> {
  await migrate();
  const r = await pool().query<User>(
    "select id, email, name, image from users where email = $1",
    [email.toLowerCase()],
  );
  return r.rows[0] ?? null;
}

export async function createAttempt(
  userId: string,
  track: Track,
  layout: Layout,
): Promise<Attempt> {
  await migrate();
  const r = await pool().query<Attempt>(
    `insert into attempts (user_id, track, layout) values ($1, $2, $3) returning *`,
    [userId, track, JSON.stringify(layout)],
  );
  return r.rows[0];
}

export async function attemptById(id: string): Promise<Attempt | null> {
  await migrate();
  const r = await pool().query<Attempt>("select * from attempts where id = $1", [
    id,
  ]);
  return r.rows[0] ?? null;
}

export async function submitAttempt(
  id: string,
  answers: Answers,
  score: number,
  passed: boolean,
): Promise<Attempt | null> {
  await migrate();
  const r = await pool().query<Attempt>(
    `update attempts set answers = $2, score = $3, passed = $4, submitted_at = now()
     where id = $1 and submitted_at is null returning *`,
    [id, JSON.stringify(answers), score, passed],
  );
  return r.rows[0] ?? null;
}

export async function attemptsForUser(userId: string): Promise<Attempt[]> {
  await migrate();
  const r = await pool().query<Attempt>(
    "select * from attempts where user_id = $1 order by started_at desc limit 50",
    [userId],
  );
  return r.rows;
}

export async function issueCertificate(
  userId: string,
  attemptId: string,
  track: Track,
): Promise<Certificate> {
  await migrate();
  const r = await pool().query<Certificate>(
    `insert into certificates (user_id, attempt_id, track) values ($1, $2, $3)
     on conflict (attempt_id) do update set track = excluded.track returning *`,
    [userId, attemptId, track],
  );
  return r.rows[0];
}

export async function certificateById(
  id: string,
): Promise<(Certificate & { user_name: string | null; user_email: string; score: number }) | null> {
  await migrate();
  const r = await pool().query(
    `select c.*, u.name as user_name, u.email as user_email, a.score
     from certificates c
     join users u on u.id = c.user_id
     join attempts a on a.id = c.attempt_id
     where c.id = $1`,
    [id],
  );
  return r.rows[0] ?? null;
}

export async function certificateForAttempt(
  attemptId: string,
): Promise<Certificate | null> {
  await migrate();
  const r = await pool().query<Certificate>(
    "select * from certificates where attempt_id = $1",
    [attemptId],
  );
  return r.rows[0] ?? null;
}

export async function certificatesForUser(userId: string): Promise<Certificate[]> {
  await migrate();
  const r = await pool().query<Certificate>(
    "select * from certificates where user_id = $1 order by issued_at desc",
    [userId],
  );
  return r.rows;
}

export async function ping(): Promise<boolean> {
  try {
    await pool().query("select 1");
    return true;
  } catch {
    return false;
  }
}
