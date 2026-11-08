import { randomUUID } from 'node:crypto';

// Never log the Prisma error message: it can contain query arguments and account data.
export function reportApiFailure(error: unknown, method: string, pathname: string) {
 const requestId = randomUUID();
 const failure = error && typeof error === 'object' ? error as {code?: unknown; message?: unknown} : {};
 const message = typeof failure.message === 'string' ? failure.message : '';
 const code = typeof failure.code === 'string' && /^[A-Z][A-Z0-9_]{1,63}$/.test(failure.code) ? failure.code : 'UNEXPECTED_ERROR';
 let reason = code;
 if (/NODE_MODULE_VERSION|compiled against a different Node\.js version/.test(message)) reason = 'SQLITE_NODE_VERSION_MISMATCH';
 else if (code === 'P2021' || code === 'P2022' || /no such (table|column)/i.test(message)) reason = 'DATABASE_SCHEMA_MISSING';
 else if (/unable to open database|readonly database|SQLITE_CANTOPEN|SQLITE_READONLY/i.test(message)) reason = 'DATABASE_FILE_UNAVAILABLE';
 console.error(JSON.stringify({event:'api_failure', requestId, method, pathname, reason}));
 return {requestId, reason};
}
