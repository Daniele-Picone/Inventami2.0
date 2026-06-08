"use client";
import {useState} from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import AppLogo from '@/components/ui/AppLogo';
import {Wine,Star,Shield} from 'lucide-react';

export default function AuthScreen(){
    const [tab,setTab]=useState<'login'|'signup'>('login');
    return <div className="min-h-screen flex">
        <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-10" style={{background:'linear-gradient(145deg,#5C1A28,#7B2D3E 50%,#9B3D52)'}}><div>
            <div className="flex items-center gap-3 mb-12"><AppLogo size={40}/>
                <span className="text-white font-bold text-xl">WineCellar</span>
        </div>
            <h1 className="text-white text-3xl font-bold leading-tight mb-4">La tua cantina,<br/>sempre sotto controllo.</h1>
            <p className="text-white/70">Gestisci l'inventario vini in tempo reale, aggiorna prezzi e giacenze, e offri un menù digitale elegante.</p>
        </div>
        <div className="flex flex-col gap-4">{[[Wine,'Inventario completo con giacenze in tempo reale'],[Star,'Menù digitale elegante per gli ospiti'],[Shield,'Più operatori possono aggiornare la cantina']].map(([I,t]:any)=><div key={t} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center"><I size={16} className="text-white"/>
            </div><span className="text-white/80 text-sm">{t}</span>
            </div>)}
            </div>
            <p className="text-white/40 text-xs">© 2026 WineCellar. Tutti i diritti riservati.</p>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="flex lg:hidden items-center gap-2 mb-8 justify-center"><AppLogo size={36}/>
                    <span className="font-bold text-lg">WineCellar</span>
                    </div>
                    <div className="flex bg-muted rounded-xl p-1 mb-8">{(['login','signup'] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg ${tab===t?'bg-card text-foreground shadow-sm':'text-muted-foreground'}`}>{t==='login'?'Accedi':'Registrati'}</button>)}
                    </div>{tab==='login'?<LoginForm/>:<SignUpForm/>}</div>
                </div>
            </div>}
