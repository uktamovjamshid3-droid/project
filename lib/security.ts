import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';
export const token = () => randomBytes(32).toString('hex');
export const digest = (s:string) => createHash('sha256').update(s).digest('hex');
export const cookieName = 'ritmo_session';
export async function currentUser() {
 const value=(await cookies()).get(cookieName)?.value;
 if(!value) return null;
 const session=await db.session.findUnique({where:{id:digest(value)},include:{user:true}});
 return session && session.expiresAt>new Date()?session.user:null;
}
export async function createSession(userId:string) {
 const raw=token();
 await db.session.create({data:{id:digest(raw),userId,expiresAt:new Date(Date.now()+30*86400000)}});
 (await cookies()).set(cookieName,raw,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:30*86400});
}
export async function rateLimit(key:string, max:number, windowMs=600000) {
 const now=new Date();
 const record=await db.rateLimit.upsert({where:{id:key},create:{id:key,count:1,expiresAt:new Date(Date.now()+windowMs)},update:{count:{increment:1}}});
 if(record.expiresAt<now){await db.rateLimit.update({where:{id:key},data:{count:1,expiresAt:new Date(Date.now()+windowMs)}});return;}
 if(record.count>max) throw new Error('Слишком много запросов. Попробуйте позже.');
}
export function safeUser(u:{id:string;name:string;email:string|null;phone:string|null;address:string}) {return {id:u.id,name:u.name,email:u.email,phone:u.phone,address:u.address};}
