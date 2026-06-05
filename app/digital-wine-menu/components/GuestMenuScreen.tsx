'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import {
  Search,
  Wine,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

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
};

function categoryLabel(category: WineCategory) {
  if (category === 'ROSSO') return 'Rosso';
  if (category === 'BIANCO') return 'Bianco';
  if (category === 'ROSE') return 'Rosé';
  if (category === 'SPUMANTE') return 'Spumante';
  return 'Dolce';
}

export default function GuestMenuScreen() {
  const { currentRestaurant } = useRestaurant();

  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(null);
  const [wines, setWines] = useState<ApiWine[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<WineCategory | 'TUTTI'>('TUTTI');
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

      const params = new URLSearchParams({ companyId });

      if (currentRestaurant?.id) {
        params.set('restaurantId', currentRestaurant.id);
      }

      const response = await fetch(`/api/wines?${params.toString()}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore caricamento vini');
      }

      setWines(
        json.wines.filter(
          (wine: ApiWine) =>
            wine.inMenu &&
            wine.status !== 'ESAURITO' &&
            wine.status !== 'ARCHIVIATO',
        ),
      );
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

  const filtered = useMemo(() => {
    return wines.filter((wine) => {
      const q = search.toLowerCase();

      const matchSearch =
        wine.name.toLowerCase().includes(q) ||
        wine.producer.toLowerCase().includes(q) ||
        wine.region.toLowerCase().includes(q);

      const matchCategory = category === 'TUTTI' || wine.category === category;

      return matchSearch && matchCategory;
    });
  }, [wines, search, category]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto p-6 xl:p-8 flex flex-col gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {currentRestaurant && (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: currentRestaurant.colore }}
                  >
                    {currentRestaurant.logo}
                  </div>
                )}

                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Menù Vini
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {currentRestaurant?.nome ||
                      loggedUser?.companyName ||
                      'WineCellar'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Vini disponibili e visibili agli ospiti.
              </p>
            </div>

            <button
              onClick={loadWines}
              className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <RefreshCw size={14} />
              Aggiorna
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              type="text"
              placeholder="Cerca vino, produttore, regione..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(['TUTTI', 'ROSSO', 'BIANCO', 'ROSE', 'SPUMANTE', 'DOLCE'] as const).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    category === item
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {item === 'TUTTI' ? 'Tutti' : categoryLabel(item)}
                </button>
              ),
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-5 shadow-sm"
              >
                <div className="h-5 w-2/3 bg-muted rounded animate-pulse mb-3" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse mb-5" />
                <div className="h-8 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((wine) => (
              <div
                key={wine.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wine size={15} className="text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      {categoryLabel(wine.category)}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-foreground">
                    {wine.name}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {wine.producer} · {wine.vintage}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {wine.region} · {wine.denomination}
                  </p>
                </div>

                {wine.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {wine.notes}
                  </p>
                )}

                {wine.pairings && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Abbinamenti:{' '}
                    </span>
                    {wine.pairings}
                  </div>
                )}

                <div className="flex items-end justify-between gap-4 border-t border-border pt-4 mt-auto">
                  <div>
                    {wine.glassPrice > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Calice €{wine.glassPrice}
                      </p>
                    )}
                    <p className="text-lg font-bold text-foreground">
                      Bottiglia €{wine.bottlePrice}
                    </p>
                  </div>

                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                    Disponibile
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Wine size={32} className="mx-auto text-muted-foreground mb-3" />
            <h3 className="font-bold text-foreground">
              Nessun vino disponibile
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Aggiungi vini dal Magazzino e abilita “Nel menù ospiti”.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}