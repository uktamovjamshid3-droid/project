import Detail from '@/components/detail';
import {loadCatalog} from '@/lib/server-catalog';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=(await loadCatalog()).find(p=>p.slug===slug);return {title:p?.title||'Товар не найден',description:p?.description};}
export default async function Page({params}:{params:Promise<{slug:string}>}) {return <Detail slug={(await params).slug}/>;}
