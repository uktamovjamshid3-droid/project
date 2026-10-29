import {Suspense} from 'react';
import Catalog from '@/components/catalog';
export const metadata={title:'Каталог'};
export default function Page(){return <Suspense fallback={<div className="container page">Загружаем коллекцию…</div>}><Catalog/></Suspense>;}
