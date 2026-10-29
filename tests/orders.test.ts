import 'dotenv/config';
import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {db} from '../lib/db';
import {placeOrder} from '../lib/orders';
import {delivery} from '../lib/catalog';
after(()=>db.$disconnect());
test('delivery threshold is calculated in whole UZS',()=>{assert.equal(delivery(499999),25000);assert.equal(delivery(500000),0);assert.equal(delivery(0),0);});
test('checkout uses database prices, aggregates duplicates and rolls back the entire order on insufficient stock',async()=>{
 const id='test-'+Date.now();
 await db.product.create({data:{id,slug:id,title:'Test product',description:'',category:'Футболки',material:'Cotton',care:'',priceUzs:89000,images:'[]',variants:{create:[{id:id+'-a',size:'M',color:'Белый',stock:3},{id:id+'-b',size:'S',color:'Белый',stock:0}]}}});
 const input={contactName:'Тест',phone:'+998901234567',address:'Тестовый адрес, дом 1',comment:'',items:[{variantId:id+'-a',quantity:1},{variantId:id+'-a',quantity:1}]};
 try{
  const order=await placeOrder(input);
  assert.equal(order.items.length,1);assert.equal(order.subtotalUzs,178000);assert.equal(order.totalUzs,203000);
  assert.equal((await db.variant.findUniqueOrThrow({where:{id:id+'-a'}})).stock,1);
  await assert.rejects(placeOrder({...input,items:[{variantId:id+'-a',quantity:1},{variantId:id+'-b',quantity:1}]}),/Недостаточно/);
  assert.equal((await db.variant.findUniqueOrThrow({where:{id:id+'-a'}})).stock,1,'earlier inventory decrement must roll back');
  assert.equal(await db.order.count({where:{items:{some:{variantId:{startsWith:id}}}}}),1);
 }finally{await db.orderItem.deleteMany({where:{variantId:{startsWith:id}}});await db.order.deleteMany({where:{id:{not:''},items:{none:{}},contactName:'Тест'}});await db.variant.deleteMany({where:{productId:id}});await db.product.delete({where:{id}});}
});
test('replaying a checkout key returns the same order without decrementing stock again',async()=>{
 const id='test-replay-'+Date.now();const key=crypto.randomUUID();
 await db.product.create({data:{id,slug:id,title:'Replay test',description:'',category:'Футболки',material:'Cotton',care:'',priceUzs:89000,images:'[]',variants:{create:{id:id+'-a',size:'M',color:'Белый',stock:3}}}});
 const input={checkoutKey:key,contactName:'Тест',phone:'+998901234567',address:'Тестовый адрес, дом 1',comment:'',items:[{variantId:id+'-a',quantity:1}]};
 try{const a=await placeOrder(input);const b=await placeOrder(input);assert.equal(a.id,b.id);assert.equal((await db.variant.findUniqueOrThrow({where:{id:id+'-a'}})).stock,2);await assert.rejects(placeOrder({...input,address:'Другой адрес, дом 2'}),/уже оформлен/);await assert.rejects(placeOrder(input,'other-user'),/уже оформлен/);}
 finally{const orders=await db.order.findMany({where:{checkoutKey:key}});await db.orderItem.deleteMany({where:{orderId:{in:orders.map(o=>o.id)}}});await db.order.deleteMany({where:{checkoutKey:key}});await db.variant.deleteMany({where:{productId:id}});await db.product.delete({where:{id}});}
});
