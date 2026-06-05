'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart2,
  Users,
  Warehouse,
  ChevronDown,
  Check,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';

const NAV = [
  ['/dashboard', BarChart2, 'Dashboard'],
  ['/magazzino', Warehouse, 'Magazzino'],
  ['/digital-wine-menu', BookOpen, 'Menù Ospiti'],
  ['/reports', FileSpreadsheet, 'Report'],
  ['/users', Users, 'Utenti'],
] as const;

type LoggedUser = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  role: 'MANAGER' | 'SOMMELIER' | 'STAFF';
  companyId: string;
  companyName?: string;
  inviteKey?: string | null;
};

function getInitials(nome?: string, cognome?: string) {
  const first = nome?.trim()?.[0] ?? '';
  const last = cognome?.trim()?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'U';
}

function roleLabel(role?: LoggedUser['role']) {
  if (role === 'MANAGER') return 'Manager';
  if (role === 'SOMMELIER') return 'Sommelier';
  if (role === 'STAFF') return 'Staff';
  return 'Utente';
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [show, setShow] = useState(false);
  const [user, setUser] = useState<LoggedUser | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  const { currentRestaurant, restaurants, setCurrentRestaurant } =
    useRestaurant();

  useEffect(() => {
    const savedUser = localStorage.getItem('winecellar_user');

    if (!savedUser) {
      router.push('/sign-up-login-screen');
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem('winecellar_user');
      router.push('/sign-up-login-screen');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('winecellar_user');
    router.push('/landing');
  };

  return (
    <aside
      className={`relative flex flex-col bg-card border-r border-border sidebar-transition shrink-0 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-3 py-4 border-b border-border ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <AppLogo size={32} />
        {!collapsed && (
          <span className="font-bold text-base text-foreground tracking-tight">
            WineCellar
          </span>
        )}
      </div>

      {!collapsed && currentRestaurant && (
        <div className="px-3 py-3 border-b border-border relative">
          <button
            onClick={() => setShow((value) => !value)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-secondary hover:bg-muted transition-colors text-left"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: currentRestaurant.colore }}
            >
              {currentRestaurant.logo}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                {currentRestaurant.nome}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {currentRestaurant.citta}
              </div>
            </div>

            <ChevronDown size={14} />
          </button>

          {show && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  I tuoi locali
                </span>
              </div>

              {restaurants.length === 0 && (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  Nessun locale trovato
                </div>
              )}

              {restaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => {
                    setCurrentRestaurant(restaurant);
                    setShow(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: restaurant.colore }}
                  >
                    {restaurant.logo}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {restaurant.nome}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {restaurant.tipo}
                    </div>
                  </div>

                  {restaurant.id === currentRestaurant.id && (
                    <Check size={14} className="text-primary" />
                  )}
                </button>
              ))}

              <div className="px-3 py-2 border-t border-border">
                <button className="w-full flex items-center gap-2 text-xs text-primary font-semibold py-1">
                  <Building2 size={13} />
                  Aggiungi locale
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {collapsed && currentRestaurant && (
        <div className="px-2 py-3 border-b border-border flex justify-center">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: currentRestaurant.colore }}
          >
            {currentRestaurant.logo}
          </div>
        </div>
      )}

      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {NAV.map(([href, Icon, label]) => {
          const active = pathname === href || pathname?.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon size={18} />

              {!collapsed && <span>{label}</span>}

              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-4 flex flex-col gap-1 border-t border-border pt-3">
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">
              {getInitials(user?.nome, user?.cognome)}
            </span>
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate">
                {user ? `${user.nome} ${user.cognome}` : 'Utente'}
              </span>
              <span className="text-xs text-muted-foreground">
                {roleLabel(user?.role)}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <LogOut size={16} />
          {!collapsed && <span>Esci</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed((value) => !value)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-secondary"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}