import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {previewCatalog} from '../lib/catalog-preview';
import {loadCatalog} from '../lib/server-catalog';

test('bundled collection includes local photos without advertising live stock',()=>{
 const products=previewCatalog();
 assert.equal(products.length,40);
 for(const p of products){
  assert.equal(p.previewOnly,true);
  assert.ok(p.variants.length>0);
  assert.ok(p.variants.every(v=>v.stock===0));
  assert.ok(p.images.every(image=>existsSync(resolve('public',image.split('#')[0].slice(1)))));
 }
});
test('Vercel without persistent database serves the read-only catalog',async()=>{
 const vercel=process.env.VERCEL,database=process.env.DATABASE_URL;
 try{
  process.env.VERCEL='1';process.env.DATABASE_URL='file:./missing-vercel.db';
  const products=await loadCatalog();
  assert.equal(products.length,40);
  assert.ok(products.every(p=>p.previewOnly&&p.variants.every(v=>v.stock===0)));
 }finally{
  if(vercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=vercel;
  if(database===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=database;
 }
});
