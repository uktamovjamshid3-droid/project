import path from 'node:path';

export function databaseConfig(env: Record<string,string|undefined> = process.env) {
 const url = env.DATABASE_URL?.trim();
 const postgres = !!url && /^postgres(ql)?:\/\//.test(url);
 if (env.VERCEL && !postgres) {
  throw new Error('DATABASE_CONFIGURATION_MISSING: Vercel requires a persistent PostgreSQL DATABASE_URL; local SQLite is not supported.');
 }
 if (postgres) return {provider:'postgresql' as const,url};
 if (url && !url.startsWith('file:')) throw new Error('DATABASE_CONFIGURATION_INVALID: expected a PostgreSQL or file: URL.');
 return {provider:'sqlite' as const,url:url?.startsWith('file:./') ? 'file:'+path.resolve('prisma',url.slice(7)) : url || 'file:'+path.resolve('prisma/dev.db')};
}
