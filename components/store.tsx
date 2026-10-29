'use client';
import {createContext,useContext,useEffect,useState,ReactNode} from 'react';
import {Product} from '@/lib/catalog';
import {api} from '@/lib/client';
type Line={variantId:string;quantity:number};
type User={id:string;name:string;email:string|null;phone:string|null;address:string};
type Store={products:Product[];loading:boolean;error:string;reload:()=>Promise<void>;cart:Line[];add:(id:string)=>void;setQty:(id:string,q:number)=>void;clear:()=>void;user:User|null;setUser:(u:User|null)=>void;toast:(s:string)=>void;wishlist:string[];favorite:(id:string)=>void;aiOpen:boolean;setAiOpen:(b:boolean)=>void};
const Context=createContext<Store>(null!);
export const useStore=()=>useContext(Context);
export function StoreProvider({children}:{children:ReactNode}) {
 const [products,setProducts]=useState<Product[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [cart,setCart]=useState<Line[]>([]),[user,setUser]=useState<User|null>(null),[message,setMessage]=useState(''),[ready,setReady]=useState(false),[wishlist,setWishlist]=useState<string[]>([]),[aiOpen,setAiOpen]=useState(false);
 async function reload(){setError('');try{setProducts(await api('products'));}catch{setError('Не удалось загрузить каталог. Проверьте соединение.');}finally{setLoading(false);}}
 useEffect(()=>{void reload();api<User|null>('auth/me').then(setUser).catch(()=>{});try{const c=JSON.parse(localStorage.getItem('ritmo-cart')||'[]');if(Array.isArray(c))setCart(c.filter(x=>x&&typeof x.variantId==='string'&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=20).slice(0,50));const w=JSON.parse(localStorage.getItem('ritmo-favorites')||'[]');if(Array.isArray(w))setWishlist(w.filter(x=>typeof x==='string'));}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready)localStorage.setItem('ritmo-cart',JSON.stringify(cart));},[cart,ready]);
 useEffect(()=>{if(ready)localStorage.setItem('ritmo-favorites',JSON.stringify(wishlist));},[wishlist,ready]);
 useEffect(()=>{if(!message)return;const t=setTimeout(()=>setMessage(''),3500);return()=>clearTimeout(t);},[message]);
 const setQty=(id:string,q:number)=>setCart(c=>q<=0?c.filter(l=>l.variantId!==id):c.map(l=>l.variantId===id?{...l,quantity:Math.min(20,q)}:l));
 const add=(id:string)=>{const v=products.flatMap(p=>p.variants).find(v=>v.id===id);if(!v||!v.stock)return;setCart(c=>{const line=c.find(l=>l.variantId===id);if(line)return c.map(l=>l.variantId===id?{...l,quantity:Math.min(v.stock,20,l.quantity+1)}:l);return [...c,{variantId:id,quantity:1}];});setMessage('Товар добавлен в корзину');};
 return <Context.Provider value={{products,loading,error,reload,cart,add,setQty,clear:()=>setCart([]),user,setUser,toast:setMessage,wishlist,favorite:id=>setWishlist(w=>w.includes(id)?w.filter(v=>v!==id):[...w,id]),aiOpen,setAiOpen}}>{children}<div className={'toast '+(message?'visible':'')} role="status">✓ {message}</div></Context.Provider>;
}
