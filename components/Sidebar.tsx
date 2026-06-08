'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import {
  BarChart2,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Landmark,
  LogOut,
  Settings,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';

type UserRole = 'MANAGER' | 'SOMMELIER' | 'STAFF';

type LoggedUser = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  role: string;
  companyId: string;
  companyName?: string;
  inviteKey?: string | null;
  plan?: string;
};

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    icon: BarChart2,
    label: 'Dashboard',
    roles: ['MANAGER'],
  },
  {
    href: '/magazzino',
    icon: Warehouse,
    label: 'Magazzino',
    roles: ['MANAGER', 'SOMMELIER'],
  },
  {
    href: '/digital-wine-menu',
    icon: BookOpen,
    label: 'Menù Ospiti',
    roles: ['MANAGER', 'SOMMELIER', 'STAFF'],
  },
  {
    href: '/reports',
    icon: FileSpreadsheet,
    label: 'Report',
    roles: ['MANAGER'],
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Settings',
    roles: ['MANAGER'],
  },
  {
    href: '/users',
    icon: Users,
    label: 'Utenti',
    roles: ['MANAGER'],
  },
];

function normalizeRole(role?: string | null): UserRole {
  const value = String(role || '').trim().toUpperCase();

  if (value === 'MANAGER') return 'MANAGER';
  if (value === 'SOMMELIER') return 'SOMMELIER';
  if (value === 'STAFF') return 'STAFF';

  return 'STAFF';
}

function getInitials(nome?: string, cognome?: string) {
  const first = nome?.trim()?.[0] ?? '';
  const last = cognome?.trim()?.[0] ?? '';

  return `${first}${last}`.toUpperCase() || 'U';
}

function roleLabel(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'MANAGER') return 'Manager';
  if (normalizedRole === 'SOMMELIER') return 'Sommelier';

  return 'Staff';
}

function readUserFromStorage(): LoggedUser | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('winecellar_user');
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as LoggedUser;
    return { ...parsed, role: normalizeRole(parsed.role) };
  } catch {
    return null;
  }
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showRestaurantMenu, setShowRestaurantMenu] = useState(false);
  const [user, setUser] = useState<LoggedUser | null>(readUserFromStorage);

  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantCity, setRestaurantCity] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantError, setRestaurantError] = useState('');
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const {
    currentRestaurant,
    restaurants,
    setCurrentRestaurant,
    createRestaurant,
  } = useRestaurant();

  const userRole = normalizeRole(user?.role);

  const canEditRestaurants =
    userRole === 'MANAGER' || userRole === 'SOMMELIER';

  useEffect(() => {
    const savedUser = localStorage.getItem('winecellar_user');

    if (!savedUser) {
      router.push('/sign-up-login-screen');
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as LoggedUser;

      const normalizedUser: LoggedUser = {
        ...parsedUser,
        role: normalizeRole(parsedUser.role),
      };

      console.log('SIDEBAR USER ROLE:', normalizedUser.role);
      console.log('SIDEBAR USER:', normalizedUser);

      setUser(normalizedUser);
      localStorage.setItem('winecellar_user', JSON.stringify(normalizedUser));
    } catch {
      localStorage.removeItem('winecellar_user');
      localStorage.removeItem('winecellar_current_restaurant');
      router.push('/sign-up-login-screen');
    }
  }, [router]);

  const visibleRestaurants = useMemo(() => {
    const companyName = user?.companyName?.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      if (!companyName) return true;

      return restaurant.nome.trim().toLowerCase() !== companyName;
    });
  }, [restaurants, user?.companyName]);

  const selectedRestaurant = useMemo(() => {
    if (
      currentRestaurant &&
      visibleRestaurants.some(
        (restaurant) => restaurant.id === currentRestaurant.id,
      )
    ) {
      return currentRestaurant;
    }

    return visibleRestaurants[0] || null;
  }, [currentRestaurant, visibleRestaurants]);

  useEffect(() => {
    if (!selectedRestaurant) return;
    if (currentRestaurant?.id === selectedRestaurant.id) return;

    setCurrentRestaurant(selectedRestaurant);
  }, [selectedRestaurant, currentRestaurant?.id, setCurrentRestaurant]);

  const allowedNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  }, [userRole]);

  const handleLogout = () => {
    localStorage.removeItem('winecellar_user');
    localStorage.removeItem('winecellar_current_restaurant');
    router.push('/landing');
  };

  const handleCreateRestaurant = async (event: FormEvent) => {
    event.preventDefault();

    if (!canEditRestaurants) {
      setRestaurantError('Non hai i permessi per creare ristoranti');
      return;
    }

    if (!restaurantName.trim()) {
      setRestaurantError('Inserisci il nome del locale');
      return;
    }

    try {
      setCreatingRestaurant(true);
      setRestaurantError('');

      await createRestaurant({
        name: restaurantName.trim(),
        type: 'Ristorante',
        city: restaurantCity.trim(),
        address: restaurantAddress.trim(),
        color: '#7B2D3E',
      });

      setRestaurantName('');
      setRestaurantCity('');
      setRestaurantAddress('');
      setShowRestaurantForm(false);
      setShowRestaurantMenu(false);
    } catch (error) {
      setRestaurantError(
        error instanceof Error
          ? error.message
          : 'Errore durante la creazione del locale',
      );
    } finally {
      setCreatingRestaurant(false);
    }
  };

  return (
    <>
      <aside
        className={`relative flex flex-col bg-card border-r border-border sidebar-transition shrink-0 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div
          className={`flex items-center gap-3 px-3 py-4 border-b border-border ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <AppLogo size={32} />

          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-base text-foreground tracking-tight block">
                WineCellar
              </span>
              <span className="text-[11px] text-muted-foreground">
                Gestionale cantina
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="px-3 py-3 border-b border-border">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/15">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Landmark size={16} className="text-primary" />
              </div>

              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Società
                </div>
                <div className="text-sm font-bold text-foreground truncate">
                  {user?.companyName || 'Azienda'}
                </div>
              </div>
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="px-3 py-3 border-b border-border relative">
            <button
              type="button"
              onClick={() => setShowRestaurantMenu((value) => !value)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-secondary hover:bg-muted transition-colors text-left"
            >
              {selectedRestaurant ? (
                <>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: selectedRestaurant.colore }}
                  >
                    {selectedRestaurant.logo}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {selectedRestaurant.nome}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {selectedRestaurant.citta || selectedRestaurant.tipo}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted text-muted-foreground shrink-0">
                    <Building2 size={14} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      Nessun locale
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Nessun ristorante selezionato
                    </div>
                  </div>
                </>
              )}

              <ChevronDown size={14} />
            </button>

            {showRestaurantMenu && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Ristoranti
                  </span>
                </div>

                {visibleRestaurants.length === 0 && (
                  <div className="px-3 py-3 text-xs text-muted-foreground">
                    Nessun ristorante creato
                  </div>
                )}

                {visibleRestaurants.map((restaurant) => (
                  <button
                    type="button"
                    key={restaurant.id}
                    onClick={() => {
                      setCurrentRestaurant(restaurant);
                      setShowRestaurantMenu(false);
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
                        {restaurant.citta || restaurant.tipo}
                      </div>
                    </div>

                    {selectedRestaurant &&
                      restaurant.id === selectedRestaurant.id && (
                        <Check size={14} className="text-primary" />
                      )}
                  </button>
                ))}

                {canEditRestaurants && (
                  <div className="px-3 py-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRestaurantForm(true);
                        setShowRestaurantMenu(false);
                      }}
                      className="w-full flex items-center gap-2 text-xs text-primary font-semibold py-1"
                    >
                      <Building2 size={13} />
                      Aggiungi ristorante
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {collapsed && (
          <div className="px-2 py-3 border-b border-border flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Landmark size={15} className="text-primary" />
            </div>
          </div>
        )}

        <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon size={18} />

                {!collapsed && <span>{item.label}</span>}

                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
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
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <LogOut size={16} />
            {!collapsed && <span>Esci</span>}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-secondary"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {showRestaurantForm && canEditRestaurants && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <form
            onSubmit={handleCreateRestaurant}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Aggiungi ristorante
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Crea un nuovo locale collegato alla società.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRestaurantForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {restaurantError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {restaurantError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Nome ristorante
              </label>
              <input
                value={restaurantName}
                onChange={(event) => setRestaurantName(event.target.value)}
                required
                placeholder="Es. Osteria del Borgo"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Città
              </label>
              <input
                value={restaurantCity}
                onChange={(event) => setRestaurantCity(event.target.value)}
                placeholder="Es. Milano"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Indirizzo
              </label>
              <input
                value={restaurantAddress}
                onChange={(event) => setRestaurantAddress(event.target.value)}
                placeholder="Es. Via Roma 12"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowRestaurantForm(false)}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary rounded-lg"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={creatingRestaurant}
                className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {creatingRestaurant ? 'Creazione...' : 'Crea ristorante'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}