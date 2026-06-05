'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import {
  BarChart2,
  Wine,
  Euro,
  AlertTriangle,
  TrendingDown,
  BookOpen,
  RefreshCw,
  TrendingUp,
  Package,
  AlertCircle,
} from 'lucide-react';
import CategoryChart from '@/app/wine-inventory-management/components/CategoryChart';

type WineCategory = 'ROSSO' | 'BIANCO' | 'ROSE' | 'SPUMANTE' | 'DOLCE';
type WineStatus = 'DISPONIBILE' | 'ESAURIMENTO' | 'ESAURITO' | 'ARCHIVIATO';

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
  createdAt: string;
  updatedAt: string;
};

type CategoryData = Record<string, number>;

function categoryLabel(category: WineCategory) {
  if (category === 'ROSSO') return 'Rosso';
  if (category === 'BIANCO') return 'Bianco';
  if (category === 'ROSE') return 'Rosé';
  if (category === 'SPUMANTE') return 'Spumante';
  return 'Dolce';
}

function statusLabel(status: WineStatus) {
  if (status === 'DISPONIBILE') return 'Disponibile';
  if (status === 'ESAURIMENTO') return 'In esaurimento';
  if (status === 'ESAURITO') return 'Esaurito';
  return 'Archiviato';
}

function computeRealStats(wines: ApiWine[]) {
  const totalBottles = wines.reduce((sum, wine) => sum + wine.stock, 0);

  const cellarValue = wines.reduce(
    (sum, wine) => sum + wine.stock * wine.bottlePrice,
    0,
  );

  const lowStock = wines.filter(
    (wine) => wine.status === 'ESAURIMENTO' || (wine.stock > 0 && wine.stock <= 3),
  ).length;

  const outOfStock = wines.filter(
    (wine) => wine.status === 'ESAURITO' || wine.stock <= 0,
  ).length;

  const byCategory = wines.reduce<CategoryData>((acc, wine) => {
    const label = categoryLabel(wine.category);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalBottles,
    cellarValue,
    lowStock,
    outOfStock,
    byCategory,
  };
}

function formatMoney(value: number) {
  return value.toLocaleString('it-IT', {
    maximumFractionDigits: 0,
  });
}

function formatLastUpdate() {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

export default function AnalyticsDashboard() {
  const { currentRestaurant } = useRestaurant();

  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(null);
  const [wines, setWines] = useState<ApiWine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const companyId = loggedUser?.companyId;

  useEffect(() => {
    const savedUser = localStorage.getItem('winecellar_user');

    if (!savedUser) {
      setLoading(false);
      setError('Sessione non trovata. Effettua di nuovo il login.');
      return;
    }

    try {
      setLoggedUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem('winecellar_user');
      setLoading(false);
      setError('Sessione non valida. Effettua di nuovo il login.');
    }
  }, []);

  const loadWines = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        companyId,
      });

      if (currentRestaurant?.id) {
        params.set('restaurantId', currentRestaurant.id);
      }

      const response = await fetch(`/api/wines?${params.toString()}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore caricamento vini');
      }

      setWines(json.wines);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Errore durante il caricamento vini',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, currentRestaurant?.id]);

  const stats = useMemo(() => computeRealStats(wines), [wines]);

  const wineCount = wines.length;
  const menuActiveCount = wines.filter((wine) => wine.inMenu).length;
  const archivedCount = wines.filter(
    (wine) => wine.status === 'ARCHIVIATO',
  ).length;

  const topWines = useMemo(() => {
    return [...wines]
      .sort((a, b) => b.bottlePrice - a.bottlePrice)
      .slice(0, 5);
  }, [wines]);

  const categoryEntries = Object.entries(stats.byCategory).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="flex flex-col gap-6 p-6 xl:p-8 max-w-screen-2xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {currentRestaurant && (
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: currentRestaurant.colore }}
              >
                {currentRestaurant.logo}
              </div>
            )}

            <span className="text-xs text-muted-foreground font-medium">
              {currentRestaurant?.nome || loggedUser?.companyName || 'WineCellar'}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Analytics
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <RefreshCw size={12} />
            Aggiornato il {formatLastUpdate()}
          </p>
        </div>

        <button
          onClick={loadWines}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-green-700">
            {loading ? 'Aggiornamento...' : 'Sistema attivo'}
          </span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-5 shadow-sm"
            >
              <div className="h-4 w-28 bg-muted rounded animate-pulse mb-4" />
              <div className="h-8 w-20 bg-muted rounded animate-pulse mb-3" />
              <div className="h-3 w-36 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              label="Bottiglie Totali"
              value={stats.totalBottles.toLocaleString('it-IT')}
              note={`${wineCount} etichette in cantina`}
              icon={<Wine size={16} />}
            />

            <Kpi
              label="Valore Cantina"
              value={`€${formatMoney(stats.cellarValue)}`}
              note="Valore a prezzo di listino"
              icon={<Euro size={16} />}
            />

            <Kpi
              warn
              label="In Esaurimento"
              value={stats.lowStock}
              note={
                stats.lowStock > 0
                  ? '≤ 3 bottiglie rimaste'
                  : 'Nessun vino in esaurimento'
              }
              icon={<AlertTriangle size={16} />}
            />

            <Kpi
              danger
              label="Esauriti"
              value={stats.outOfStock}
              note={
                stats.outOfStock > 0
                  ? 'Nascosti dal menù ospiti'
                  : 'Tutti i vini disponibili'
              }
              icon={<TrendingDown size={16} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} />
                <span className="text-sm font-semibold">
                  Distribuzione per Categoria
                </span>
              </div>

              {wineCount > 0 ? (
                <CategoryChart data={stats.byCategory} />
              ) : (
                <EmptyBox text="Aggiungi i primi vini per vedere il grafico." />
              )}
            </div>

            <div className="flex flex-col gap-4">
              <Kpi
                label="Nel Menù Ospiti"
                value={menuActiveCount}
                note="Vini visibili agli ospiti"
                icon={<BookOpen size={16} />}
              />

              <Kpi
                label="Archiviati"
                value={archivedCount}
                note="Non in rotazione attiva"
                icon={<Package size={16} />}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} />
                <span className="text-sm font-semibold">
                  Top 5 Vini per Valore
                </span>
              </div>

              {topWines.length > 0 ? (
                topWines.map((wine, index) => (
                  <div
                    key={wine.id}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      #{index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {wine.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {wine.producer} · {wine.vintage}
                      </div>
                    </div>

                    <span className="text-sm font-bold">
                      €{wine.bottlePrice}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyBox text="Nessun vino presente." />
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Wine size={16} />
                <span className="text-sm font-semibold">
                  Etichette per Categoria
                </span>
              </div>

              {categoryEntries.length > 0 ? (
                categoryEntries.map(([category, count]) => {
                  const pct =
                    wineCount > 0 ? Math.round((count / wineCount) * 100) : 0;

                  return (
                    <div key={category} className="mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{category}</span>
                        <span className="text-muted-foreground">
                          {count} etichette · {pct}%
                        </span>
                      </div>

                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyBox text="Nessuna categoria disponibile." />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function Kpi({
  label,
  value,
  note,
  icon,
  warn,
  danger,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  icon: React.ReactNode;
  warn?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`bg-card border rounded-xl p-5 flex flex-col gap-3 shadow-sm ${
        warn
          ? 'bg-orange-50 border-orange-200'
          : danger
            ? 'bg-red-50 border-red-200'
            : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>

        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>

      <div className="text-hero-metric font-bold text-foreground tabular">
        {value}
      </div>

      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}