'use client';
import {Printer} from 'lucide-react';
export function PrintReceipt(){return <button className="text-link" onClick={()=>window.print()}><Printer size={17}/> Сохранить / распечатать</button>;}
