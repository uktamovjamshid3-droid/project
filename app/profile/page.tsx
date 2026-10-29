import {Suspense} from 'react';
import Profile from '@/components/profile';
export const metadata={title:'Личный кабинет'};
export default function Page(){return <Suspense fallback={<div className="container page">Загружаем профиль…</div>}><Profile/></Suspense>;}
