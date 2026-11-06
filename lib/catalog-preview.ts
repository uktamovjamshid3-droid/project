import {Product, productPhotos, seeds} from './catalog';

// Bundled, read-only collection. Never treat these variants as live inventory.
export function previewCatalog(): Product[] {
 return seeds.map(([slug,title,category,priceUzs,material,description],index)=>{
  const [sheet,cell]=productPhotos[slug]||['collection.png',index];
  const colors=seeds[index][7].split(',');
  const sizes=['Сумки','Аксессуары'].includes(category)?['ONE SIZE']:['XS','S','M','L','XL','XXL','3XL'];
  return {id:slug,slug,title,category,priceUzs,material,description,
   images:[`/${sheet}#${cell}`],createdAt:'2026-01-01T00:00:00.000Z',
   care:'Рекомендации по уходу уточняйте на этикетке изделия.',previewOnly:true,
   variants:colors.flatMap((color,ci)=>sizes.map(size=>({id:`${slug}-${ci}-${size}`,size,color,stock:0})))
  };
 });
}
