'use client';
import {useEffect} from 'react';
export function DialogAccessibility(){useEffect(()=>{
 let active:HTMLElement|null=null,previous:HTMLElement|null=null;
 const focusable=()=>active?Array.from(active.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select,textarea,[tabindex="0"]')).filter(el=>el.getClientRects().length):[];
 const sync=()=>{const dialogs=document.querySelectorAll<HTMLElement>('[role="dialog"]');const next=dialogs.length?dialogs[dialogs.length-1]:null;if(next===active)return;if(active&&!next)previous?.focus();if(next){previous=document.activeElement as HTMLElement;active=next;requestAnimationFrame(()=>focusable()[0]?.focus());}active=next;};
 const keys=(e:KeyboardEvent)=>{if(!active)return;if(e.key==='Escape'){const close=active.querySelector<HTMLElement>('[aria-label^="Закрыть"]');close?.click();e.preventDefault();}if(e.key==='Tab'){const list=focusable();const first=list[0],last=list.at(-1);if(!first)return;if(e.shiftKey&&(document.activeElement===first||!active.contains(document.activeElement))){last?.focus();e.preventDefault();}else if(!e.shiftKey&&(document.activeElement===last||!active.contains(document.activeElement))){first.focus();e.preventDefault();}}};
 const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('keydown',keys);sync();return()=>{observer.disconnect();document.removeEventListener('keydown',keys);};
 },[]);return null;}
