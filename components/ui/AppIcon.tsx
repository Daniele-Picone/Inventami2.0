"use client";
import React from 'react';
import * as Outline from '@heroicons/react/24/outline';
import * as Solid from '@heroicons/react/24/solid';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
type IconVariant='outline'|'solid';
interface IconProps{ name:string; variant?:IconVariant; size?:number; className?:string; onClick?:()=>void; disabled?:boolean; [key:string]:unknown }
export default function Icon({name,variant='outline',size=24,className='',onClick,disabled=false,...props}:IconProps){const set=variant==='solid'?Solid:Outline;const C=set[name as keyof typeof set] as React.ComponentType<any>|undefined;const cn=`${disabled?'opacity-50 cursor-not-allowed':onClick?'cursor-pointer hover:opacity-80':''} ${className}`;if(!C)return <QuestionMarkCircleIcon width={size} height={size} className={`text-gray-400 ${cn}`} onClick={disabled?undefined:onClick} {...props}/>;return <C width={size} height={size} className={cn} onClick={disabled?undefined:onClick} {...props}/>;}
