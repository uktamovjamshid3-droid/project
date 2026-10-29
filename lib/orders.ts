import { db } from './db';
import { delivery } from './catalog';
export type Checkout = {contactName:string;phone:string;address:string;comment:string;items:{variantId:string;quantity:number}[]};
export async function placeOrder(input: Checkout, userId?:string) {
 const combined = new Map<string,number>();
 for(const item of input.items) combined.set(item.variantId,(combined.get(item.variantId)||0)+item.quantity);
 return db.$transaction(async tx=>{
  let subtotal=0;
  const items=[];
  for(const [variantId,quantity] of combined) {
   if(quantity>20) throw new Error('Не более 20 единиц одного варианта.');
   const variant=await tx.variant.findUnique({where:{id:variantId},include:{product:true}});
   if(!variant || !variant.product.active) throw new Error('Товар больше недоступен. Обновите корзину.');
   const result=await tx.variant.updateMany({where:{id:variantId,stock:{gte:quantity}},data:{stock:{decrement:quantity}}});
   if(result.count!==1) throw new Error(`Недостаточно товара «${variant.product.title}», ${variant.size}, ${variant.color}.`);
   subtotal+=variant.product.priceUzs*quantity;
   items.push({variantId,quantity,titleSnapshot:variant.product.title,unitPriceUzs:variant.product.priceUzs});
  }
  const fee=delivery(subtotal);
  return tx.order.create({data:{contactName:input.contactName,phone:input.phone,address:input.address,comment:input.comment,userId,subtotalUzs:subtotal,deliveryUzs:fee,totalUzs:subtotal+fee,items:{create:items}},include:{items:{include:{variant:true}}}});
 });
}
