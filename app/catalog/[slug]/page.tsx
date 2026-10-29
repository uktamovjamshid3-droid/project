import Detail from '@/components/detail';
import {db} from '@/lib/db';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const p=await db.product.findUnique({where:{slug:(await params).slug}});return {title:p?.title||'Товар не найден',description:p?.description};}
export default async function Page({params}:{params:Promise<{slug:string}>}) {return <Detail slug={(await params).slug}/>;}
