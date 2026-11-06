import type {Product} from './catalog';
import {previewCatalog} from './catalog-preview';

export async function loadCatalog(): Promise<Product[]> {
 // Vercel cannot persist this application's local SQLite file.
 if(process.env.VERCEL && (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')))return previewCatalog();
 try {
  // Keep native database initialization inside the error boundary as well.
  const {db}=await import('./db');
  const products=await db.product.findMany({where:{active:true},include:{variants:true},orderBy:{createdAt:'desc'}});
  return products.map(p=>({...p,images:JSON.parse(p.images),createdAt:p.createdAt.toISOString()}));
 } catch(error) {
  console.error('Live catalog unavailable; serving the read-only collection.',error);
  return previewCatalog();
 }
}
