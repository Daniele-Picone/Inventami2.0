'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import {
  Plus,
  Search,
  Wine,
  Edit2,
  Trash2,
  AlertCircle,
  X,
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
  restaurantId: string;
  restaurant?: {
    id: string;
    name: string;
  };
};

type WineFormState = {
  id?: string;
  name: string;
  producer: string;
  region: string;
  denomination: string;
  vintage: string;
  category: WineCategory;
  stock: string;
  glassPrice: string;
  bottlePrice: string;
  alcohol: string;
  format: string;
  notes: string;
  pairings: string;
  inMenu: boolean;
};

const emptyForm: WineFormState = {
  name: '',
  producer: '',
  region: '',
  denomination: '',
  vintage: new Date().getFullYear().toString(),
  category: 'ROSSO',
  stock: '0',
  glassPrice: '0',
  bottlePrice: '0',
  alcohol: '0',
  format: '0.75L',
  notes: '',
  pairings: '',
  inMenu: true,
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

function statusClass(status: WineStatus) {
  if (status === 'DISPONIBILE') return 'bg-green-100 text-green-700';
  if (status === 'ESAURIMENTO') return 'bg-orange-100 text-orange-700';
  if (status === 'ESAURITO') return 'bg-red-100 text-red-700';
  return 'bg-muted text-muted-foreground';
}

function wineToForm(wine: ApiWine): WineFormState {
  return {
    id: wine.id,
    name: wine.name,
    producer: wine.producer,
    region: wine.region,
    denomination: wine.denomination,
    vintage: String(wine.vintage),
    category: wine.category,
    stock: String(wine.stock),
    glassPrice: String(wine.glassPrice),
    bottlePrice: String(wine.bottlePrice),
    alcohol: String(wine.alcohol),
    format: wine.format,
    notes: wine.notes || '',
    pairings: wine.pairings || '',
    inMenu: wine.inMenu,
  };
}

export default function InventoryDashboard() {
  const { currentRestaurant } = useRestaurant();

  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(null);
  const [wines, setWines] = useState<ApiWine[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<WineCategory | 'TUTTI'>('TUTTI');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WineFormState>(emptyForm);

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

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (wine: ApiWine) => {
    setForm(wineToForm(wine));
    setShowForm(true);
  };

  const saveWine = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentRestaurant?.id) {
      setError('Nessun locale selezionato');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        ...form,
        restaurantId: currentRestaurant.id,
      };

      const response = await fetch('/api/wines', {
        method: form.id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore salvataggio vino');
      }

      setShowForm(false);
      setForm(emptyForm);
      await loadWines();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Errore durante il salvataggio vino',
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteWine = async (id: string) => {
    const confirmed = window.confirm('Vuoi eliminare questo vino?');

    if (!confirmed) return;

    try {
      setError('');

      const response = await fetch(`/api/wines?id=${id}`, {
        method: 'DELETE',
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore eliminazione vino');
      }

      await loadWines();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Errore durante eliminazione vino',
      );
    }
  };

  const updateForm = (
    key: keyof WineFormState,
    value: string | boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
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

          <h1 className="text-2xl font-bold text-foreground">Magazzino</h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            {wines.length} etichette nel database reale
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
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90"
          >
            <Plus size={16} />
            Aggiungi vino
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
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            type="text"
            placeholder="Cerca vino..."
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

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
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
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-border">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-5 w-full max-w-md bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))}

              {!loading &&
                filtered.map((wine) => (
                  <tr
                    key={wine.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                          <Wine size={15} className="text-primary" />
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {wine.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {wine.producer} · {wine.vintage}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {categoryLabel(wine.category)}
                    </td>

                    <td className="px-4 py-3 text-sm font-bold">
                      {wine.stock}
                    </td>

                    <td className="px-4 py-3 text-sm font-bold">
                      €{wine.bottlePrice}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(
                          wine.status,
                        )}`}
                      >
                        {statusLabel(wine.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(wine)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          onClick={() => deleteWine(wine.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nessun vino trovato
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <form
            onSubmit={saveWine}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl p-6 fade-in flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {form.id ? 'Modifica vino' : 'Aggiungi vino'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Salva il vino nel database Supabase
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Input label="Nome" value={form.name} onChange={(v) => updateForm('name', v)} required />
              <Input label="Produttore" value={form.producer} onChange={(v) => updateForm('producer', v)} required />
              <Input label="Regione" value={form.region} onChange={(v) => updateForm('region', v)} required />
              <Input label="Denominazione" value={form.denomination} onChange={(v) => updateForm('denomination', v)} required />
              <Input label="Annata" type="number" value={form.vintage} onChange={(v) => updateForm('vintage', v)} required />
              <Input label="Stock" type="number" value={form.stock} onChange={(v) => updateForm('stock', v)} required />
              <Input label="Prezzo calice" type="number" value={form.glassPrice} onChange={(v) => updateForm('glassPrice', v)} />
              <Input label="Prezzo bottiglia" type="number" value={form.bottlePrice} onChange={(v) => updateForm('bottlePrice', v)} required />
              <Input label="Alcol %" type="number" value={form.alcohol} onChange={(v) => updateForm('alcohol', v)} />
              <Input label="Formato" value={form.format} onChange={(v) => updateForm('format', v)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Categoria
              </label>
              <select
                value={form.category}
                onChange={(event) =>
                  updateForm('category', event.target.value as WineCategory)
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="ROSSO">Rosso</option>
                <option value="BIANCO">Bianco</option>
                <option value="ROSE">Rosé</option>
                <option value="SPUMANTE">Spumante</option>
                <option value="DOLCE">Dolce</option>
              </select>
            </div>

            <Textarea
              label="Note"
              value={form.notes}
              onChange={(v) => updateForm('notes', v)}
            />

            <Textarea
              label="Abbinamenti"
              value={form.pairings}
              onChange={(v) => updateForm('pairings', v)}
            />

            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={form.inMenu}
                onChange={(event) => updateForm('inMenu', event.target.checked)}
              />
              Visibile nel menù ospiti
            </label>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary rounded-lg"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : 'Salva vino'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <textarea
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
      />
    </div>
  );
}