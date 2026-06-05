'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import {
  FileSpreadsheet,
  Download,
  Wine,
  Euro,
  AlertTriangle,
  Package,
  RefreshCw,
  AlertCircle,
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
  restaurant?: {
    id: string;
    name: string;
  };
};

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

export default function WineReportsScreen() {
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

      const params = new URLSearchParams({ companyId });

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

  const stats = useMemo(() => {
    const totalBottles = wines.reduce((sum, wine) => sum + wine.stock, 0);
    const totalValue = wines.reduce(
      (sum, wine) => sum + wine.stock * wine.bottlePrice,
      0,
    );
    const lowStock = wines.filter(
      (wine) => wine.stock > 0 && wine.stock <= 3,
    ).length;
    const outOfStock = wines.filter((wine) => wine.stock <= 0).length;

    return {
      totalBottles,
      totalValue,
      lowStock,
      outOfStock,
    };
  }, [wines]);

  const exportCsv = () => {
    const rows = [
      [
        'Nome',
        'Produttore',
        'Regione',
        'Denominazione',
        'Annata',
        'Categoria',
        'Giacenza',
        'Prezzo Calice',
        'Prezzo Bottiglia',
        'Stato',
        'Nel Menu',
        'Locale',
      ],
      ...wines.map((wine) => [
        wine.name,
        wine.producer,
        wine.region,
        wine.denomination,
        wine.vintage,
        categoryLabel(wine.category),
        wine.stock,
        wine.glassPrice,
        wine.bottlePrice,
        statusLabel(wine.status),
        wine.inMenu ? 'Sì' : 'No',
        wine.restaurant?.name || '',
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'winecellar-report.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

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
            Report Cantina
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            Analisi e export dei vini reali nel database
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadWines}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-sm font-semibold rounded-lg hover:bg-secondary"
          >
            <RefreshCw size={16} />
            Aggiorna
          </button>

          <button
            onClick={exportCsv}
            disabled={wines.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Esporta CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard
          label="Etichette"
          value={loading ? '...' : wines.length}
          icon={<Wine size={18} />}
        />

        <ReportCard
          label="Bottiglie"
          value={loading ? '...' : stats.totalBottles}
          icon={<Package size={18} />}
        />

        <ReportCard
          label="Valore"
          value={
            loading
              ? '...'
              : `€${stats.totalValue.toLocaleString('it-IT', {
                  maximumFractionDigits: 0,
                })}`
          }
          icon={<Euro size={18} />}
        />

        <ReportCard
          label="Alert"
          value={loading ? '...' : stats.lowStock + stats.outOfStock}
          icon={<AlertTriangle size={18} />}
        />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FileSpreadsheet size={16} />
          <span className="text-sm font-semibold">Dettaglio vini</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Vino
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Categoria
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Stock
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Prezzo
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Stato
                </th>
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-border">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-5 w-full max-w-md bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))}

              {!loading &&
                wines.map((wine) => (
                  <tr
                    key={wine.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-foreground">
                        {wine.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {wine.producer} · {wine.vintage}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {categoryLabel(wine.category)}
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold">
                      {wine.stock}
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold">
                      €{wine.bottlePrice}
                    </td>

                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {statusLabel(wine.status)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {!loading && wines.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nessun vino presente. Aggiungi vini dal Magazzino.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>

      <div>
        <div className="text-xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}