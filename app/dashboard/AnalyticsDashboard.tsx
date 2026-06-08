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
  Building2,
  GlassWater,
} from 'lucide-react';
import CategoryChart from '@/app/wine-inventory-management/components/CategoryChart';

type WineCategory = 'ROSSO' | 'BIANCO' | 'ROSE' | 'SPUMANTE' | 'DOLCE';
type WineStatus = 'DISPONIBILE' | 'ESAURIMENTO' | 'ESAURITO' | 'ARCHIVIATO';
type UserRole = 'MANAGER' | 'SOMMELIER' | 'STAFF';

type LoggedUser = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  role: 'MANAGER' | 'SOMMELIER' | 'STAFF' | string;
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
  minStock: number;
  purchasePrice: number;
  bottlePrice: number;
  glassPrice: number;
  availableByGlass?: boolean;

  supplier: string;

  alcohol: number;
  format: string;
  notes?: string | null;
  pairings?: string | null;
  grapeVarieties?: string | null;

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

const GLASSES_PER_BOTTLE = 5;

function normalizeRole(role?: string | null): UserRole {
  const value = String(role || '').trim().toUpperCase();

  if (value === 'MANAGER') return 'MANAGER';
  if (value === 'SOMMELIER') return 'SOMMELIER';
  if (value === 'STAFF') return 'STAFF';

  return 'STAFF';
}

function categoryLabel(category: WineCategory) {
  if (category === 'ROSSO') return 'Rosso';
  if (category === 'BIANCO') return 'Bianco';
  if (category === 'ROSE') return 'Rosé';
  if (category === 'SPUMANTE') return 'Spumante';
  return 'Dolce';
}

function getBottleRevenue(wine: ApiWine) {
  return wine.stock * wine.bottlePrice;
}

function getGlassRevenue(wine: ApiWine) {
  if (!wine.availableByGlass) return 0;
  if (!wine.glassPrice) return 0;

  return wine.stock * wine.glassPrice * GLASSES_PER_BOTTLE;
}

function getBestRevenue(wine: ApiWine) {
  const bottleRevenue = getBottleRevenue(wine);
  const glassRevenue = getGlassRevenue(wine);

  return Math.max(bottleRevenue, glassRevenue);
}

function getPurchaseCost(wine: ApiWine) {
  return wine.stock * wine.purchasePrice;
}

function computeStats(wines: ApiWine[]) {
  const totalBottles = wines.reduce((sum, wine) => sum + wine.stock, 0);

  const purchaseValue = wines.reduce(
    (sum, wine) => sum + getPurchaseCost(wine),
    0,
  );

  const bottleSellingValue = wines.reduce(
    (sum, wine) => sum + getBottleRevenue(wine),
    0,
  );

  const glassSellingValue = wines.reduce(
    (sum, wine) => sum + getGlassRevenue(wine),
    0,
  );

  const bestSellingValue = wines.reduce(
    (sum, wine) => sum + getBestRevenue(wine),
    0,
  );

  const bottleMarginValue = bottleSellingValue - purchaseValue;
  const glassMarginValue = glassSellingValue - purchaseValue;
  const bestMarginValue = bestSellingValue - purchaseValue;

  const bestMarginPercent =
    bestSellingValue > 0
      ? Math.round((bestMarginValue / bestSellingValue) * 100)
      : 0;

  const lowStock = wines.filter(
    (wine) => wine.stock > 0 && wine.stock <= (wine.minStock || 3),
  ).length;

  const outOfStock = wines.filter((wine) => wine.stock <= 0).length;

  const reorderCount = wines.filter(
    (wine) => wine.stock <= (wine.minStock || 3),
  ).length;

  const byCategory = wines.reduce<CategoryData>((acc, wine) => {
    const label = categoryLabel(wine.category);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const byRestaurant = wines.reduce<Record<string, number>>((acc, wine) => {
    const restaurantName = wine.restaurant?.name || 'Locale';
    acc[restaurantName] = (acc[restaurantName] ?? 0) + wine.stock;
    return acc;
  }, {});

  const byRestaurantPurchase = wines.reduce<Record<string, number>>(
    (acc, wine) => {
      const restaurantName = wine.restaurant?.name || 'Locale';
      acc[restaurantName] =
        (acc[restaurantName] ?? 0) + getPurchaseCost(wine);
      return acc;
    },
    {},
  );

  const byRestaurantBestRevenue = wines.reduce<Record<string, number>>(
    (acc, wine) => {
      const restaurantName = wine.restaurant?.name || 'Locale';
      acc[restaurantName] =
        (acc[restaurantName] ?? 0) + getBestRevenue(wine);
      return acc;
    },
    {},
  );

  const bySupplier = wines.reduce<Record<string, number>>((acc, wine) => {
    const supplier = wine.supplier || 'Senza fornitore';
    acc[supplier] = (acc[supplier] ?? 0) + getPurchaseCost(wine);
    return acc;
  }, {});

  return {
    totalBottles,

    purchaseValue,

    bottleSellingValue,
    glassSellingValue,
    bestSellingValue,

    bottleMarginValue,
    glassMarginValue,
    bestMarginValue,
    bestMarginPercent,

    lowStock,
    outOfStock,
    reorderCount,

    byCategory,
    byRestaurant,
    byRestaurantPurchase,
    byRestaurantBestRevenue,
    bySupplier,
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
  const { currentRestaurant, restaurants, setCurrentRestaurant } =
    useRestaurant();

  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState<string>('ALL');
  const [initializedSelection, setInitializedSelection] = useState(false);

  const [wines, setWines] = useState<ApiWine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');

  const companyId = loggedUser?.companyId;
  const userRole = normalizeRole(loggedUser?.role);
  const isManager = userRole === 'MANAGER';

  const visibleRestaurants = useMemo(() => {
    const companyName = loggedUser?.companyName?.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      if (!companyName) return true;
      return restaurant.nome.trim().toLowerCase() !== companyName;
    });
  }, [restaurants, loggedUser?.companyName]);

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

  useEffect(() => {
    if (!loggedUser || initializedSelection) return;

    const role = normalizeRole(loggedUser.role);

    if (role === 'MANAGER') {
      setSelectedRestaurantId('ALL');
      setInitializedSelection(true);
      return;
    }

    if (currentRestaurant?.id) {
      setSelectedRestaurantId(currentRestaurant.id);
      setInitializedSelection(true);
    }
  }, [loggedUser, currentRestaurant?.id, initializedSelection]);

  const effectiveRestaurantId = useMemo(() => {
    if (isManager) {
      return selectedRestaurantId === 'ALL' ? null : selectedRestaurantId;
    }

    return currentRestaurant?.id || selectedRestaurantId || null;
  }, [isManager, selectedRestaurantId, currentRestaurant?.id]);

  const selectedRestaurantName = useMemo(() => {
    if (isManager && selectedRestaurantId === 'ALL') {
      return 'Totale società';
    }

    const found = visibleRestaurants.find(
      (restaurant) => restaurant.id === effectiveRestaurantId,
    );

    return found?.nome || currentRestaurant?.nome || 'Nessun ristorante';
  }, [
    isManager,
    selectedRestaurantId,
    visibleRestaurants,
    effectiveRestaurantId,
    currentRestaurant?.nome,
  ]);

  const handleRestaurantChange = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);

    if (restaurantId === 'ALL') return;

    const restaurant = visibleRestaurants.find(
      (item) => item.id === restaurantId,
    );

    if (restaurant) {
      setCurrentRestaurant(restaurant);
    }
  };

  const loadWines = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({ companyId });

      if (effectiveRestaurantId) {
        params.set('restaurantId', effectiveRestaurantId);
      }

      const response = await fetch(`/api/wines?${params.toString()}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore caricamento vini');
      }

      setWines(json.wines || []);
      setLastUpdate(formatLastUpdate());
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
  }, [companyId, effectiveRestaurantId]);

  const stats = useMemo(() => computeStats(wines), [wines]);

  const wineCount = wines.length;

  const menuActiveCount = wines.filter((wine) => wine.inMenu).length;

  const availableByGlassCount = wines.filter(
    (wine) => wine.availableByGlass,
  ).length;

  const topWinesByValue = useMemo(() => {
    return [...wines]
      .sort((a, b) => getBestRevenue(b) - getBestRevenue(a))
      .slice(0, 5);
  }, [wines]);

  const topWinesByGlassRevenue = useMemo(() => {
    return [...wines]
      .filter((wine) => wine.availableByGlass)
      .sort((a, b) => getGlassRevenue(b) - getGlassRevenue(a))
      .slice(0, 5);
  }, [wines]);

  const reorderWines = useMemo(() => {
    return wines
      .filter((wine) => wine.stock <= (wine.minStock || 3))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8);
  }, [wines]);

  const supplierEntries = Object.entries(stats.bySupplier).sort(
    (a, b) => b[1] - a[1],
  );

  const categoryEntries = Object.entries(stats.byCategory).sort(
    (a, b) => b[1] - a[1],
  );

  const restaurantEntries = Object.entries(stats.byRestaurant).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="flex flex-col gap-6 p-6 xl:p-8 max-w-screen-2xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-primary/15 text-primary">
              <Building2 size={13} />
            </div>

            <span className="text-xs text-muted-foreground font-medium">
              {selectedRestaurantName}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Analytics
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <RefreshCw size={12} />
            {lastUpdate ? `Aggiornato il ${lastUpdate}` : 'Caricamento dati...'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isManager && (
            <select
              value={selectedRestaurantId}
              onChange={(event) => handleRestaurantChange(event.target.value)}
              className="px-3 py-2.5 bg-card border border-border text-sm font-semibold rounded-lg outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="ALL">Totale società</option>

              {visibleRestaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.nome}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={loadWines}
            className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-green-700">
              {loading ? 'Aggiornamento...' : 'Sistema attivo'}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
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
              label="Spese Acquisto"
              value={`€${formatMoney(stats.purchaseValue)}`}
              note="Totale costo bottiglie in stock"
              icon={<Euro size={16} />}
            />

            <Kpi
              label="Valore Vendita Bottiglia"
              value={`€${formatMoney(stats.bottleSellingValue)}`}
              note="Se venduto tutto in bottiglia"
              icon={<Wine size={16} />}
            />

            <Kpi
              label="Potenziale Calice"
              value={`€${formatMoney(stats.glassSellingValue)}`}
              note={`${GLASSES_PER_BOTTLE} calici stimati per bottiglia`}
              icon={<GlassWater size={16} />}
            />

            <Kpi
              label="Ricavo Migliore"
              value={`€${formatMoney(stats.bestSellingValue)}`}
              note="Tra vendita bottiglia e calice"
              icon={<TrendingUp size={16} />}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              label="Margine Potenziale"
              value={`€${formatMoney(stats.bestMarginValue)}`}
              note={`${stats.bestMarginPercent}% sul ricavo migliore`}
              icon={<BarChart2 size={16} />}
            />

            <Kpi
              label="Bottiglie Totali"
              value={stats.totalBottles.toLocaleString('it-IT')}
              note={`${wineCount} etichette in cantina`}
              icon={<Wine size={16} />}
            />

            <Kpi
              warn
              label="Da Riordinare"
              value={stats.reorderCount}
              note="Sotto soglia minima"
              icon={<AlertTriangle size={16} />}
            />

            <Kpi
              danger
              label="Esauriti"
              value={stats.outOfStock}
              note="Stock a zero"
              icon={<TrendingDown size={16} />}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              label="Nel Menù Ospiti"
              value={menuActiveCount}
              note="Vini visibili agli ospiti"
              icon={<BookOpen size={16} />}
            />

            <Kpi
              label="Al Calice"
              value={availableByGlassCount}
              note="Etichette vendibili al calice"
              icon={<GlassWater size={16} />}
            />

            <Kpi
              label="Margine Bottiglia"
              value={`€${formatMoney(stats.bottleMarginValue)}`}
              note="Solo vendita bottiglia"
              icon={<Euro size={16} />}
            />

            <Kpi
              label="Margine Calice"
              value={`€${formatMoney(stats.glassMarginValue)}`}
              note="Solo vini vendibili al calice"
              icon={<GlassWater size={16} />}
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

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Wine size={16} />
                <span className="text-sm font-semibold">
                  Etichette per Categoria
                </span>
              </div>

              {categoryEntries.length > 0 ? (
                categoryEntries.map(([categoryName, count]) => {
                  const pct =
                    wineCount > 0 ? Math.round((count / wineCount) * 100) : 0;

                  return (
                    <ProgressRow
                      key={categoryName}
                      label={categoryName}
                      value={`${count} etichette · ${pct}%`}
                      pct={pct}
                    />
                  );
                })
              ) : (
                <EmptyBox text="Nessuna categoria disponibile." />
              )}
            </div>
          </div>

          {isManager && selectedRestaurantId === 'ALL' && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} />
                <span className="text-sm font-semibold">
                  Andamento Economico per Ristorante
                </span>
              </div>

              {restaurantEntries.length > 0 ? (
                restaurantEntries.map(([restaurantName, count]) => {
                  const purchase =
                    stats.byRestaurantPurchase[restaurantName] || 0;
                  const bestRevenue =
                    stats.byRestaurantBestRevenue[restaurantName] || 0;
                  const margin = bestRevenue - purchase;

                  const pct =
                    stats.totalBottles > 0
                      ? Math.round((count / stats.totalBottles) * 100)
                      : 0;

                  return (
                    <div key={restaurantName} className="mb-4">
                      <div className="flex justify-between text-xs gap-3">
                        <span className="font-medium">{restaurantName}</span>
                        <span className="text-muted-foreground text-right">
                          {count} bottiglie · acquisto €{formatMoney(purchase)} ·
                          ricavo €{formatMoney(bestRevenue)} · margine €
                          {formatMoney(margin)}
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
                <EmptyBox text="Nessun ristorante con vini presenti." />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel
              title="Top 5 Ricavo Migliore"
              icon={<TrendingUp size={16} />}
            >
              {topWinesByValue.length > 0 ? (
                topWinesByValue.map((wine, index) => (
                  <WineRow
                    key={wine.id}
                    index={index + 1}
                    title={wine.name}
                    subtitle={`${wine.producer} · ${wine.vintage}${
                      isManager && selectedRestaurantId === 'ALL'
                        ? ` · ${wine.restaurant?.name || 'Locale'}`
                        : ''
                    }`}
                    value={`€${formatMoney(getBestRevenue(wine))}`}
                  />
                ))
              ) : (
                <EmptyBox text="Nessun vino presente." />
              )}
            </Panel>

            <Panel
              title="Top Calice"
              icon={<GlassWater size={16} />}
            >
              {topWinesByGlassRevenue.length > 0 ? (
                topWinesByGlassRevenue.map((wine, index) => (
                  <WineRow
                    key={wine.id}
                    index={index + 1}
                    title={wine.name}
                    subtitle={`${wine.stock} bottiglie × ${GLASSES_PER_BOTTLE} calici × €${wine.glassPrice}${
                      isManager && selectedRestaurantId === 'ALL'
                        ? ` · ${wine.restaurant?.name || 'Locale'}`
                        : ''
                    }`}
                    value={`€${formatMoney(getGlassRevenue(wine))}`}
                  />
                ))
              ) : (
                <EmptyBox text="Nessun vino al calice." />
              )}
            </Panel>

            <Panel title="Top Fornitori" icon={<Package size={16} />}>
              {supplierEntries.length > 0 ? (
                supplierEntries.slice(0, 6).map(([supplier, value], index) => (
                  <WineRow
                    key={supplier}
                    index={index + 1}
                    title={supplier}
                    subtitle="Spese acquisto in stock"
                    value={`€${formatMoney(value)}`}
                  />
                ))
              ) : (
                <EmptyBox text="Nessun fornitore disponibile." />
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Da Riordinare" icon={<AlertTriangle size={16} />}>
              {reorderWines.length > 0 ? (
                reorderWines.map((wine, index) => (
                  <WineRow
                    key={wine.id}
                    index={index + 1}
                    title={wine.name}
                    subtitle={`${wine.supplier || 'Senza fornitore'}${
                      isManager && selectedRestaurantId === 'ALL'
                        ? ` · ${wine.restaurant?.name || 'Locale'}`
                        : ''
                    }`}
                    value={`${wine.stock}/${wine.minStock || 3}`}
                    danger={wine.stock <= 0}
                  />
                ))
              ) : (
                <EmptyBox text="Nessun vino da riordinare." />
              )}
            </Panel>

            <Panel title="Margini più alti" icon={<BarChart2 size={16} />}>
              {[...wines]
                .sort((a, b) => {
                  const marginA = getBestRevenue(a) - getPurchaseCost(a);
                  const marginB = getBestRevenue(b) - getPurchaseCost(b);
                  return marginB - marginA;
                })
                .slice(0, 8)
                .map((wine, index) => {
                  const margin = getBestRevenue(wine) - getPurchaseCost(wine);

                  return (
                    <WineRow
                      key={wine.id}
                      index={index + 1}
                      title={wine.name}
                      subtitle={`${wine.producer}${
                        isManager && selectedRestaurantId === 'ALL'
                          ? ` · ${wine.restaurant?.name || 'Locale'}`
                          : ''
                      }`}
                      value={`€${formatMoney(margin)}`}
                    />
                  );
                })}
            </Panel>
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

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
      </div>

      {children}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  pct,
}: {
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WineRow({
  index,
  title,
  subtitle,
  value,
  danger,
}: {
  index: number;
  title: string;
  subtitle: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="text-xs font-bold text-muted-foreground w-5">
        #{index}
      </span>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
      </div>

      <span
        className={`text-sm font-bold ${
          danger ? 'text-red-600' : 'text-foreground'
        }`}
      >
        {value}
      </span>
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