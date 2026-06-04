"use client";
import React,{memo,useMemo} from 'react';
import { Wine } from 'lucide-react';
interface AppLogoProps{size?:number;className?:string;onClick?:()=>void}
const AppLogo=memo(function AppLogo({size=64,className='',onClick}:AppLogoProps){const cn=useMemo(()=>['flex items-center justify-center rounded-lg bg-primary text-primary-foreground',onClick?'cursor-pointer hover:opacity-80 transition-opacity':'',className].filter(Boolean).join(' '),[onClick,className]);return <div className={cn} onClick={onClick} style={{width:size,height:size}}><Wine size={Math.round(size*.58)}/></div>});export default AppLogo;
