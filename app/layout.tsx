import type {Metadata} from 'next';
import '@fontsource-variable/manrope';
import './globals.css';
import {DialogAccessibility} from '@/components/dialog-accessibility';
import {StoreProvider} from '@/components/store';
import {Header,Footer,AIChat} from '@/components/chrome';
export const metadata:Metadata={title:{default:'RITMO — твой стиль в твоём ритме',template:'%s · RITMO'},description:'Повседневная одежда, в которой удобно быть собой. Открой коллекцию RITMO: футболки, худи, джинсы и аксессуары. Цены в UZS.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ru"><body><StoreProvider><DialogAccessibility/><a className="skip" href="#main">К содержимому</a><Header/><main id="main">{children}</main><Footer/><AIChat/></StoreProvider></body></html>;}
