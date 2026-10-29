'use client';
export default function Error({reset}:{reset:()=>void}){return <div className="container page empty"><h1>Что-то пошло не по ритму</h1><p>Попробуйте загрузить страницу ещё раз.</p><button className="btn" onClick={reset}>Повторить</button></div>;}
