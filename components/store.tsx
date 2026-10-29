'use client';
import {createContext,useContext,useEffect,useRef,useState,ReactNode} from 'react';
import {Product} from '@/lib/catalog';
import {api} from '@/lib/client';
type Line={variantId:string;quantity:number};
export type User={id:string;name:string;email:string|null;phone:string|null;address:string};
type Store={products:Product[];loading:boolean;error:string;reload:()=>Promise<void>;cart:Line[];cartReady:boolean;cartError:string;retryCart:()=>void;add:(id:string)=>void;setQty:(id:string,q:number)=>void;clear:()=>void;flushCart:()=>Promise<void>;user:User|null;setUser:(u:User|null)=>void;authLoading:boolean;toast:(s:string)=>void;wishlist:string[];favorite:(id:string)=>void;aiOpen:boolean;setAiOpen:(b:boolean)=>void};
const Context=createContext<Store>(null!);
export const useStore=()=>useContext(Context);
function readLines():Line[]{try{const value=JSON.parse(localStorage.getItem('ritmo-cart')||'[]');return Array.isArray(value)?value.filter(x=>x&&typeof x.variantId==='string'&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=20).slice(0,50):[];}catch{return [];}}
function save(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* The in-memory cart still works when storage is unavailable. */}}
export function StoreProvider({children}:{children:ReactNode}) {
 const [products,setProducts]=useState<Product[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [cart,setCart]=useState<Line[]>([]),[user,setUser]=useState<User|null>(null),[message,setMessage]=useState(''),[ready,setReady]=useState(false),[cartReady,setCartReady]=useState(false),[authLoading,setAuthLoading]=useState(true),[wishlist,setWishlist]=useState<string[]>([]),[aiOpen,setAiOpen]=useState(false);
 const [cartError,setCartError]=useState(''),[cartAttempt,setCartAttempt]=useState(0);
 const currentId=useRef<string|null>(null),writeQueue=useRef(Promise.resolve());const loadedId=useRef<string|null|undefined>(undefined);
 async function reload(){setError('');try{setProducts(await api('products'));}catch{setError('Не удалось загрузить каталог. Проверьте соединение.');}finally{setLoading(false);}}
 useEffect(()=>{void reload();api<User|null>('auth/me').then(setUser).catch(()=>{}).finally(()=>setAuthLoading(false));try{const w=JSON.parse(localStorage.getItem('ritmo-favorites')||'[]');if(Array.isArray(w))setWishlist(w.filter(x=>typeof x==='string'));}catch{}setReady(true);},[]);
 useEffect(()=>{
  if(authLoading)return;let cancelled=false;setCartReady(false);setCartError('');loadedId.current=undefined;currentId.current=user?.id||null;
  if(!user){loadedId.current=null;setCart(readLines());setCartReady(true);return;}
  api<Line[]>('cart',{mode:'merge',items:readLines()}).then(lines=>{if(cancelled)return;loadedId.current=user.id;setCart(lines);save('ritmo-cart',[]);setCartReady(true);}).catch(()=>{if(cancelled)return;setCart([]);setCartError('Не удалось загрузить корзину аккаунта. Проверьте соединение и попробуйте ещё раз.');});
  return()=>{cancelled=true;};
 },[user?.id,authLoading,cartAttempt]);
 useEffect(()=>{
  if(!cartReady || loadedId.current!==(user?.id||null))return;if(!user){save('ritmo-cart',cart);return;}
  const id=user.id;writeQueue.current=writeQueue.current.then(async()=>{if(currentId.current!==id)return;try{await api('cart',{mode:'replace',items:cart});}catch{if(currentId.current===id)setMessage('Корзина не синхронизирована. Проверьте соединение.');}});
 },[cart,cartReady,user?.id]);
 useEffect(()=>{if(ready)save('ritmo-favorites',wishlist);},[wishlist,ready]);
 useEffect(()=>{if(!message)return;const t=setTimeout(()=>setMessage(''),4000);return()=>clearTimeout(t);},[message]);
 const setQty=(id:string,q:number)=>{if(!cartReady)return;setCart(c=>q<=0?c.filter(l=>l.variantId!==id):c.map(l=>l.variantId===id?{...l,quantity:Math.min(20,q)}:l));};
 const add=(id:string)=>{if(!cartReady){setMessage('Подождите загрузки корзины');return;}const v=products.flatMap(p=>p.variants).find(v=>v.id===id);if(!v||!v.stock)return;setCart(c=>{const line=c.find(l=>l.variantId===id);if(line)return c.map(l=>l.variantId===id?{...l,quantity:Math.min(v.stock,20,l.quantity+1)}:l);return [...c,{variantId:id,quantity:1}];});setMessage('Товар добавлен в корзину');};
 return <Context.Provider value={{products,loading,error,reload,cart,cartReady,cartError,retryCart:()=>setCartAttempt(n=>n+1),add,setQty,clear:()=>setCart([]),flushCart:()=>writeQueue.current,user,setUser,authLoading,toast:setMessage,wishlist,favorite:id=>setWishlist(w=>w.includes(id)?w.filter(v=>v!==id):[...w,id]),aiOpen,setAiOpen}}>{children}<div className={'toast '+(message?'visible':'')} role="status">✓ {message}</div></Context.Provider>;
}
