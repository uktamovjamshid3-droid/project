import { PrismaClient } from '@prisma/client';
import {adapter} from './adapter';
const globalDb = globalThis as unknown as {prisma?: PrismaClient};
export const db = globalDb.prisma ?? new PrismaClient({adapter:adapter()});
if (process.env.NODE_ENV !== 'production') globalDb.prisma = db;
