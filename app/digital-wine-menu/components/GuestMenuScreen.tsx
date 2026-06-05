'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Search,
  Wine,
  Sparkles,
  Grape,
  Flower2,
  Droplets,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/context/RestaurantContext';

type LoggedUser = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  role: 'MANAGER' | 'SOMMELIER' | 'STAFF';
  companyId: string;
  companyName?: string;
};

type WineCategory = 'ROSSO' | 'BIANCO' | 'ROSE' | 'SPUMANTE' | 'DOLCE';

type WineStatus = 'DISPONIBILE' | 'ESAURIMENTO' | 'ESAURITO' | 'ARCHIVIATO';

type ApiWine = {
  id: string;
  name: string;
  producer: string;
  region: string;
  denomination: string;
  vintage: number;
  category: WineCategory;
  stock: number;
  glassPrice: number;
  bottlePrice: number;
  alcohol: number;
  format: string;
  notes?: string | null;
  pairings?: string | null;
  status: WineStatus;
  inMenu: boolean;
  restaurantId: string;
  restaurant?: {
    id: string;
    name: string;
  };
};

const CATEGORY_ORDER: WineCategory[] = [
  'SPUMANTE',
  'BIANCO',
  'ROSE',
  'ROSSO',
  'DOLCE',
];

const CATEGORY_LABELS: Record<WineCategory, string> = {
  SPUMANTE: 'Bollicine',
  BIANCO: 'Bianchi',
  ROSE: 'Rosati',
  ROSSO: 'Rossi',
  DOLCE: 'Dolci',
};

const CATEGORY_ICONS: Record<WineCategory, React.ReactNode> = {
  SPUMANTE: <Sparkles size={16} />,
  BIANCO: <Droplets size={16} />,
  ROSE: <Flower2 size={16} />,
  ROSSO: <Wine size={16} />,
  DOLCE: <Grape size={16} />,
};

function formatPrice(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0);
}

function getLoggedUser(): LoggedUser | null {
  if (typeof window === 'undefined') return null;

  const savedUser = localStorage.getItem('winecellar_user');

  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('winecellar_user');
    return null;
  }
}

function WineMenuCard({ wine }: { wine: ApiWine }) {
  return (
    <article className="group flex flex-col md:flex-row md:items-start justify-between gap-5 rounded-2xl border border-border bg-card px-5 py-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] md:text-[17px] font-extrabold text-foreground leading-snug">
              {wine.name}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {wine.producer}
              {wine.vintage ? ` · ${wine.vintage}` : ''}
            </p>
          </div>

          {wine.status === 'ESAURIMENTO' && (
            <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              Ultime bottiglie
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{wine.denomination}</span>

          {wine.region && (
            <>
              <span className="text-border">•</span>
              <span>{wine.region}</span>
            </>
          )}

          {wine.alcohol > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{wine.alcohol}% vol.</span>
            </>
          )}

          {wine.format && (
            <>
              <span className="text-border">•</span>
              <span>{wine.format}</span>
            </>
          )}
        </div>

        {wine.notes && (
          <p className="mt-3 text-sm italic leading-relaxed text-muted-foreground">
            {wine.notes}
          </p>
        )}

        {wine.pairings && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            <span className="text-primary font-semibold">Abbinamenti:</span>{' '}
            {wine.pairings}
          </p>
        )}
      </div>

      <div className="md:text-right shrink-0 md:min-w-[110px]">
        <div className="text-2xl font-black tracking-tight text-primary">
          {formatPrice(wine.bottlePrice)}
        </div>

        <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          bottiglia
        </div>

        {wine.glassPrice > 0 && (
          <div className="mt-3">
            <div className="text-sm font-bold text-foreground">
              {formatPrice(wine.glassPrice)}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              calice
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function CategorySection({
  category,
  wines,
}: {
  category: WineCategory;
  wines: ApiWine[];
}) {
  if (wines.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-primary">
          {CATEGORY_ICONS[category]}
        </div>

        <h2 className="text-base font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
          {CATEGORY_LABELS[category]}
        </h2>

        <div className="h-px flex-1 bg-border" />

        <span className="text-xs font-semibold text-muted-foreground">
          {wines.length} {wines.length === 1 ? 'etichetta' : 'etichette'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {wines.map((wine) => (
          <WineMenuCard key={wine.id} wine={wine} />
        ))}
      </div>
    </section>
  );
}

export default function GuestMenuScreen() {
  const router = useRouter();
  const { currentRestaurant } = useRestaurant();

  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(null);
  const [wines, setWines] = useState<ApiWine[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<WineCategory | 'TUTTI'>('TUTTI');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const companyId = loggedUser?.companyId;

  useEffect(() => {
    const user = getLoggedUser();

    if (!user) {
      setLoading(false);
      setError('Sessione non trovata. Effettua di nuovo il login.');
      return;
    }

    setLoggedUser(user);
  }, []);

  useEffect(() => {
    const loadWines = async () => {
      if (!companyId) return;

      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({ companyId });

        if (currentRestaurant?.id) {
          params.set('restaurantId', currentRestaurant.id);
        }

        const response = await fetch(`/api/wines?${params.toString()}`);
        const text = await response.text();

        let json: {
          wines?: ApiWine[];
          error?: string;
          details?: string;
        } = {};

        if (text) {
          try {
            json = JSON.parse(text);
          } catch {
            console.error('RISPOSTA NON JSON DA /api/wines:', text);
            throw new Error(
              'La API /api/wines non sta restituendo JSON valido.',
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            json.details ||
              json.error ||
              `Errore API /api/wines: ${response.status}`,
          );
        }

        setWines(json.wines || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Errore durante il caricamento della carta vini',
        );
      } finally {
        setLoading(false);
      }
    };

    loadWines();
  }, [companyId, currentRestaurant?.id]);

  const visibleWines = useMemo(() => {
    const q = search.trim().toLowerCase();

    return wines
      .filter((wine) => wine.inMenu)
      .filter((wine) => wine.status !== 'ARCHIVIATO')
      .filter((wine) => wine.status !== 'ESAURITO')
      .filter((wine) => wine.stock > 0)
      .filter((wine) => {
        if (category !== 'TUTTI' && wine.category !== category) {
          return false;
        }

        if (!q) return true;

        return (
          wine.name.toLowerCase().includes(q) ||
          wine.producer.toLowerCase().includes(q) ||
          wine.region.toLowerCase().includes(q) ||
          wine.denomination.toLowerCase().includes(q) ||
          String(wine.vintage).includes(q)
        );
      });
  }, [wines, search, category]);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((item) => ({
      category: item,
      wines: visibleWines.filter((wine) => wine.category === item),
    })).filter((group) => group.wines.length > 0);
  }, [visibleWines]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
              <Wine size={24} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight text-primary">
                Carta dei Vini
              </h1>

              <p className="truncate text-xs text-muted-foreground">
                {currentRestaurant?.nome ||
                  loggedUser?.companyName ||
                  'Selezione curata'}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <span className="hidden sm:inline">Torna alla dashboard</span>
            <ArrowLeft size={16} className="sm:hidden" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-6">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca vino, produttore, regione, annata..."
              className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('TUTTI')}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
              category === 'TUTTI'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            Tutti
          </button>

          {CATEGORY_ORDER.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                category === item
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {CATEGORY_ICONS[item]}
              {CATEGORY_LABELS[item]}
            </button>
          ))}
        </div>

        {loading && (
          <div className="py-20 text-center text-sm font-semibold text-muted-foreground">
            Caricamento carta vini…
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && visibleWines.length === 0 && (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
              <Wine size={22} />
            </div>

            <p className="text-sm font-semibold text-muted-foreground">
              Nessun vino disponibile nel menù.
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Controlla che i vini siano visibili nel menù ospiti e disponibili
              a magazzino.
            </p>
          </div>
        )}

        {!loading && !error && grouped.length > 0 && (
          <div>
            {grouped.map((group) => (
              <CategorySection
                key={group.category}
                category={group.category}
                wines={group.wines}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}