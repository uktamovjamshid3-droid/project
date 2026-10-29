import 'dotenv/config';
import { db } from '../lib/db';
import { seeds } from '../lib/catalog';

async function main() {
 for (const [index,[slug,title,category,priceUzs,material,description,photo,colors]] of seeds.entries()) {
  await db.product.upsert({where:{slug},update:{images:JSON.stringify([`/collection.png#${index}`])},create:{id:slug,slug,title,category,priceUzs,material,description,care:'Бережная стирка при 30 °C. Не отбеливать. Сушить естественным способом.',images:JSON.stringify([`/collection.png#${index}`]),variants:{create:colors.split(',').flatMap((color,ci)=>(category==='Аксессуары'?['ONE SIZE']:['XS','S','M','L','XL']).map((size,si)=>({id:`${slug}-${ci}-${size}`,size,color,stock:si===4&&ci===1?0:12})))}}});
 }
 console.log('10 demonstration products seeded (existing stock preserved).');
}
main().finally(()=>db.$disconnect());
