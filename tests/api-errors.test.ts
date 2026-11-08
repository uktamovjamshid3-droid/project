import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reportApiFailure} from '../lib/api-errors';

test('API failure diagnostics distinguish database causes without logging account data',()=>{
 const original=console.error;
 const records:string[]=[];
 console.error=(line:string)=>{records.push(line);};
 try {
  for(const [error,reason] of [
   [{code:'P2022',message:'secret@example.com passwordHash:private'},'DATABASE_SCHEMA_MISSING'],
   [new Error('compiled against a different Node.js version using NODE_MODULE_VERSION 127'),'SQLITE_NODE_VERSION_MISMATCH'],
   [new Error('unable to open database file'),'DATABASE_FILE_UNAVAILABLE'],
   [new Error('secret@example.com private'),'UNEXPECTED_ERROR'],
  ] as const){
   const result=reportApiFailure(error,'POST','/api/auth/register');
   assert.equal(result.reason,reason);
   assert.match(result.requestId,/^[a-f0-9-]{36}$/);
   const logged=JSON.parse(records.at(-1)!);
   assert.equal(logged.requestId,result.requestId);
   assert.equal(logged.reason,reason);
  }
  assert.ok(records.every(line=>!line.includes('secret@example.com')&&!line.includes('private')));
 } finally {console.error=original;}
});
