/**
 * One-shot migration runner. Uses the Supabase Management API.
 * Reads SUPABASE_ACCESS_TOKEN from .env via `node --env-file=.env`.
 *
 * Run: pnpm migrate
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const PROJECT_REF = 'kwnhahaxqcqindlkgzgu';
const MIGRATIONS_DIR = join(__dirname, '../supabase/migrations');

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      'SUPABASE_ACCESS_TOKEN missing. Generate at supabase.com/dashboard/account/tokens and add to .env',
    );
  }

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Running ${files.length} migration(s) against project ${PROJECT_REF}...`);

  for (const file of files) {
    process.stdout.write(`  ${file}... `);
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf-8');

    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.log('FAILED');
      throw new Error(`Migration ${file} failed (${res.status}): ${errText}`);
    }
    console.log('ok');
  }

  console.log('All migrations applied.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
