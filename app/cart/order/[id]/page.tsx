import {cookies} from 'next/headers';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {Check,ArrowRight,MapPin,Package,Wallet} from 'lucide-react';
import {db} from '@/lib/db';
import {currentUser,digest} from '@/lib/security';
import {money} from '@/lib/catalog';
import {PrintReceipt} from '@/components/receipt';
export const metadata={title:'Твой заказ',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Receipt({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const u=await currentUser();const receipt=(await cookies()).get('ritmo_receipt_'+id)?.value;
 const order=await db.order.findUnique({where:{id},include:{items:{include:{variant:{include:{product:true}}}}}});
 if(!order || !(u?.id===order.userId || (receipt&&order.receiptTokenHash===digest(receipt))))notFound();
 return <div className="container page order-success receipt"><span className="success-icon"><Check size={40}/></span><span className="tiny-label">СПАСИБО, ЧТО ВЫБИРАЕШЬ RITMO</span><h1>Твой заказ принят<span className="blue-dot">.</span></h1><p>Номер заказа <b>{order.id}</b><br/>{new Intl.DateTimeFormat('ru-RU',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Tashkent'}).format(order.createdAt)}</p><div className="receipt-grid"><section className="panel"><h2><Package size={22}/> Твои вещи</h2>{order.items.map(i=><div className="receipt-item" key={i.id}><Link href={'/catalog/'+i.variant.product.slug}>{i.titleSnapshot}<small>{i.variant.size} / {i.variant.color} · {i.quantity} шт.</small></Link><b>{money(i.unitPriceUzs*i.quantity)}</b></div>)}<div className="receipt-address"><MapPin size={18}/><div><b>{order.contactName}</b><p>{order.address}<br/>{order.phone}</p></div></div></section><section className="success-summary"><span>Статус <b>{order.status}</b></span><span>Товары <b>{money(order.subtotalUzs)}</b></span><span>Доставка <b>{order.deliveryUzs?money(order.deliveryUzs):'Бесплатно'}</b></span><span className="receipt-total">К оплате при получении <b>{money(order.totalUzs)}</b></span><p><Wallet size={16}/> Наличными при получении</p></section></div><p>Демонстрационный заказ. Покупка не приводит к реальной оплате или доставке.<br/>Гостевое подтверждение доступно в этом браузере 7 дней. Заказы аккаунта сохраняются в профиле.</p><div className="receipt-actions"><Link className="btn" href="/catalog">Продолжить покупки <ArrowRight size={18}/></Link><PrintReceipt/>{u&&<Link className="text-link" href="/profile">Все мои заказы <ArrowRight size={16}/></Link>}</div></div>;
}
