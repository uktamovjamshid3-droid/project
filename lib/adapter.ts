import {PrismaBetterSQLite3} from '@prisma/adapter-better-sqlite3';
import path from 'node:path';
export const adapter = () => new PrismaBetterSQLite3({url:process.env.DATABASE_URL?.startsWith('file:./') ? 'file:'+path.resolve('prisma',process.env.DATABASE_URL.slice(7)) : process.env.DATABASE_URL || 'file:'+path.resolve('prisma/dev.db')});
