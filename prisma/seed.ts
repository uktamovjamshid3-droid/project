import 'dotenv/config';
import { db } from '../lib/db';
import { seeds, productPhotos } from '../lib/catalog';

async function main() {
 for (const [index,[slug,title,category,priceUzs,material,description,_photo,colors]] of seeds.entries()) {
  const [sheet,cell] = productPhotos[slug] || ['collection.png', index];
  const images = JSON.stringify([`/${sheet}#${cell}`]);
  const care = category === 'Сумки'
   ? 'Очищать мягкой влажной тканью. Не стирать в машине. Сушить вдали от нагревательных приборов.'
   : material.includes('шерсть') || material.includes('акрил')
    ? 'Ручная стирка в прохладной воде. Не отбеливать. Сушить горизонтально.'
    : 'Бережная стирка при 30 °C. Не отбеливать. Сушить естественным способом.';
  await db.$transaction(async tx => {
   const product = await tx.product.upsert({where:{slug},update:{title,category,priceUzs,material,description,care,images},create:{id:slug,slug,title,category,priceUzs,material,description,care,images}});
   const sizes = category === 'Аксессуары' || category === 'Сумки' ? ['ONE SIZE'] : ['XS','S','M','L','XL','XXL','3XL'];
   for (const [ci,color] of colors.split(',').entries()) {
    for (const [si,size] of sizes.entries()) {
     const id = `${slug}-${ci}-${size}`;
     // Never replenish an existing variant: orders may already have reduced its stock.
     await tx.variant.upsert({where:{id},update:{},create:{id,productId:product.id,size,color,stock:si===4&&ci===1?0:12}});
    }
   }
  });
 }
 console.log(`${seeds.length} demonstration products seeded (existing stock preserved).`);
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>db.$disconnect());
