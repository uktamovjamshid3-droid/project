import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {databaseConfig} from '../lib/database-config';

test('Vercel requires a persistent database instead of silently using a local file',()=>{
 for(const url of [undefined,'file:./dev.db','']) assert.throws(()=>databaseConfig({VERCEL:'1',DATABASE_URL:url}),/DATABASE_CONFIGURATION_MISSING/);
 assert.deepEqual(databaseConfig({VERCEL:'1',DATABASE_URL:'postgresql://test:password@localhost/ritmo'}),{provider:'postgresql',url:'postgresql://test:password@localhost/ritmo'});
 assert.equal(databaseConfig({DATABASE_URL:'postgres://localhost/ritmo'}).provider,'postgresql');
});

test('local development keeps the existing SQLite database path',()=>{
 assert.deepEqual(databaseConfig({DATABASE_URL:'file:./dev.db'}),{provider:'sqlite',url:'file:'+path.resolve('prisma/dev.db')});
 assert.equal(databaseConfig({DATABASE_URL:'file:/tmp/ritmo.db'}).url,'file:/tmp/ritmo.db');
 assert.throws(()=>databaseConfig({DATABASE_URL:'https://invalid.example'}),/DATABASE_CONFIGURATION_INVALID/);
});

test('PostgreSQL and SQLite expose identical models',()=>{
 const sqlite=readFileSync('prisma/schema.prisma','utf8');
 const postgres=readFileSync('prisma/schema.postgresql.prisma','utf8').split('\n').slice(1).join('\n');
 assert.equal(postgres,sqlite.replace('provider = "sqlite"','provider = "postgresql"'));
});
