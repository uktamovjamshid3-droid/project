export async function api<T=any>(path:string,body?:unknown):Promise<T> {
 const res=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await res.json();
 if(!res.ok)throw new Error(data.error || 'Ошибка сети. Попробуйте ещё раз.');
 return data;
}
