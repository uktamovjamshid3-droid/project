import 'dotenv/config';
import {db} from '../lib/db';
// Only the reserved identities and contact names created by this project's E2E suite.
async function main(){
 const users=await db.user.findMany({where:{email:{startsWith:'browser-',endsWith:'@example.com'},name:{in:['Тест Покупатель','API User']}}});
 await db.$transaction(async tx=>{
 const orders=await tx.order.findMany({where:{OR:[{userId:{in:users.map(u=>u.id)}},{userId:null,contactName:'API Test',address:'Тестовый адрес, дом 10'}]},include:{items:true}});
 for(const order of orders){for(const item of order.items)await tx.variant.update({where:{id:item.variantId},data:{stock:{increment:item.quantity}}});await tx.orderItem.deleteMany({where:{orderId:order.id}});await tx.order.delete({where:{id:order.id}});}
 await tx.user.deleteMany({where:{id:{in:users.map(u=>u.id)}}});
 console.log(`Removed ${users.length} E2E users and ${orders.length} E2E orders; restored their inventory.`);
 });
}
main().finally(()=>db.$disconnect());
