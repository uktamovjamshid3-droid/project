import Link from 'next/link';
export default function NotFound(){return <div className="container page empty"><span className="tiny-label">404 / НЕ В ЭТОМ РИТМЕ</span><h1>Эта страница куда-то ушла.</h1><Link className="btn" href="/catalog">Найдём что-нибудь в каталоге →</Link></div>;}
