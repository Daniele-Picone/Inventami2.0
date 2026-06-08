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
  Building2,
} from 'lucide-react';

type LoggedUser = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  role: 'MANAGER' | 'SOMMELIER' | 'STAFF' | string;
  companyId: string;
  companyName?: string;
};

type WineCategory = 'ROSSO' | 'BIANCO' | 'ROSE' | 'SPUMANTE' | 'DOLCE';
type WineStatus = 'DISPONIBILE' | 'ESAURIMENTO' | 'ESAURITO' | 'ARCHIVIATO';
type UserRole = 'MANAGER' | 'SOMMELIER' | 'STAFF';

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
};

type WineFormState = {
  id?: string;
  restaurantId: string;
  name: string;
  producer: string;
  region: string;
  denomination: string;
  vintage: string;
  category: WineCategory;

  stock: string;
  minStock: string;
  purchasePrice: string;
  bottlePrice: string;
  glassPrice: string;
  availableByGlass: boolean;

  supplier: string;

  alcohol: string;
  format: string;
  notes: string;
  pairings: string;
  grapeVarieties: string;

  inMenu: boolean;
};

const emptyForm: WineFormState = {
  restaurantId: '',
  name: '',
  producer: '',
  region: '',
  denomination: '',
  vintage: new Date().getFullYear().toString(),
  category: 'ROSSO',

  stock: '0',
  minStock: '3',
  purchasePrice: '0',
  bottlePrice: '0',
  glassPrice: '0',
  availableByGlass: false,

  supplier: '',

  alcohol: '0',
  format: '0.75L',
  notes: '',
  pairings: '',
  grapeVarieties: '',

  inMenu: true,
};

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

function cleanText(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

function isSameWineIdentity(a: ApiWine, b: ApiWine) {
  return (
    cleanText(a.name) === cleanText(b.name) &&
    cleanText(a.producer) === cleanText(b.producer) &&
    cleanText(a.denomination) === cleanText(b.denomination) &&
    Number(a.vintage) === Number(b.vintage)
  );
}

function wineToForm(wine: ApiWine): WineFormState {
  return {
    id: wine.id,
    restaurantId: wine.restaurantId,
    name: wine.name,
    producer: wine.producer,
    region: wine.region,
    denomination: wine.denomination,
    vintage: String(wine.vintage),
    category: wine.category,

    stock: String(wine.stock),
    minStock: String(wine.minStock || 3),
    purchasePrice: String(wine.purchasePrice || 0),
    bottlePrice: String(wine.bottlePrice || 0),
    glassPrice: String(wine.glassPrice || 0),
    availableByGlass: Boolean(wine.availableByGlass),

    supplier: wine.supplier || '',

    alcohol: String(wine.alcohol || 0),
    format: wine.format || '0.75L',
    notes: wine.notes || '',
    pairings: wine.pairings || '',
    grapeVarieties: wine.grapeVarieties || '',

    inMenu: wine.inMenu,
  };
}

export default function InventoryDashboard() {
  const { currentRestaurant, restaurants, setCurrentRestaurant } =
    useRestaurant();

  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState<string>('ALL');
  const [initializedSelection, setInitializedSelection] = useState(false);

  const [wines, setWines] = useState<ApiWine[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<WineCategory | 'TUTTI'>('TUTTI');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WineFormState>(emptyForm);

  const [extraRestaurantIds, setExtraRestaurantIds] = useState<string[]>([]);
  const [editingWine, setEditingWine] = useState<ApiWine | null>(null);

  const companyId = loggedUser?.companyId;
  const userRole = normalizeRole(loggedUser?.role);
  const isManager = userRole === 'MANAGER';
  const canEdit = userRole === 'MANAGER' || userRole === 'SOMMELIER';

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
      return 'Tutti i ristoranti';
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

  const filtered = useMemo(() => {
    return wines.filter((wine) => {
      const q = search.toLowerCase();

      const matchSearch =
        wine.name.toLowerCase().includes(q) ||
        wine.producer.toLowerCase().includes(q) ||
        wine.region.toLowerCase().includes(q) ||
        wine.grapeVarieties?.toLowerCase().includes(q) ||
        wine.supplier?.toLowerCase().includes(q) ||
        wine.restaurant?.name?.toLowerCase().includes(q);

      const matchCategory = category === 'TUTTI' || wine.category === category;

      return matchSearch && matchCategory;
    });
  }, [wines, search, category]);

  const totals = useMemo(() => {
    const totalBottles = wines.reduce((sum, wine) => sum + wine.stock, 0);

    const purchaseValue = wines.reduce(
      (sum, wine) => sum + wine.stock * wine.purchasePrice,
      0,
    );

    const sellingValue = wines.reduce(
      (sum, wine) => sum + wine.stock * wine.bottlePrice,
      0,
    );

    const marginValue = sellingValue - purchaseValue;

    const reorderCount = wines.filter(
      (wine) => wine.stock <= (wine.minStock || 3),
    ).length;

    const outOfStock = wines.filter((wine) => wine.stock <= 0).length;

    return {
      totalBottles,
      purchaseValue,
      sellingValue,
      marginValue,
      reorderCount,
      outOfStock,
    };
  }, [wines]);

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

  const toggleExtraRestaurant = (restaurantId: string) => {
    setExtraRestaurantIds((prev) => {
      if (prev.includes(restaurantId)) {
        return prev.filter((id) => id !== restaurantId);
      }

      return [...prev, restaurantId];
    });
  };

  const openCreate = () => {
    if (!canEdit) {
      setError('Non hai i permessi per aggiungere vini');
      return;
    }

    if (visibleRestaurants.length === 0) {
      setError('Crea prima almeno un ristorante reale.');
      return;
    }

    const defaultRestaurantId =
      effectiveRestaurantId ||
      currentRestaurant?.id ||
      visibleRestaurants[0]?.id ||
      '';

    setError('');
    setEditingWine(null);

    setForm({
      ...emptyForm,
      restaurantId: defaultRestaurantId,
    });

    setExtraRestaurantIds([]);
    setShowForm(true);
  };

  const openEdit = async (wine: ApiWine) => {
    if (!canEdit) {
      setError('Non hai i permessi per modificare vini');
      return;
    }

    try {
      setError('');
      setEditingWine(wine);

      let allCompanyWines = wines;

      if (companyId) {
        const params = new URLSearchParams({ companyId });
        const response = await fetch(`/api/wines?${params.toString()}`);
        const json = await response.json();

        if (response.ok) {
          allCompanyWines = json.wines || wines;
        }
      }

      const sameWineRows = allCompanyWines.filter((item: ApiWine) =>
        isSameWineIdentity(item, wine),
      );

      const restaurantIdsWhereWineExists = sameWineRows.map(
        (item: ApiWine) => item.restaurantId,
      );

      setForm({
        ...wineToForm(wine),
        restaurantId: wine.restaurantId,
      });

      setExtraRestaurantIds(
        restaurantIdsWhereWineExists.filter((id) => id !== wine.restaurantId),
      );

      setShowForm(true);
    } catch (err) {
      console.error(err);

      setForm({
        ...wineToForm(wine),
        restaurantId: wine.restaurantId,
      });

      setExtraRestaurantIds([]);
      setShowForm(true);
    }
  };

  const saveWine = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canEdit) {
      setError('Non hai i permessi per salvare vini');
      return;
    }

    if (!form.restaurantId) {
      setError('Seleziona il ristorante principale');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const selectedRestaurantIds = Array.from(
        new Set([form.restaurantId, ...extraRestaurantIds]),
      );

      if (form.id && editingWine && companyId) {
        const params = new URLSearchParams({ companyId });
        const response = await fetch(`/api/wines?${params.toString()}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || 'Errore caricamento vini società');
        }

        const allCompanyWines = (json.wines || []) as ApiWine[];

        const sameWineRows = allCompanyWines.filter((item) =>
          isSameWineIdentity(item, editingWine),
        );

        const existingRestaurantIds = sameWineRows.map(
          (item) => item.restaurantId,
        );

        for (const wineRow of sameWineRows) {
          const shouldKeep = selectedRestaurantIds.includes(
            wineRow.restaurantId,
          );

          if (!shouldKeep) {
            const deleteParams = new URLSearchParams({
              id: wineRow.id,
            });

            if (loggedUser?.id) {
              deleteParams.set('userId', loggedUser.id);
            }

            const deleteResponse = await fetch(
              `/api/wines?${deleteParams.toString()}`,
              {
                method: 'DELETE',
              },
            );

            const deleteJson = await deleteResponse.json();

            if (!deleteResponse.ok) {
              throw new Error(
                deleteJson.error || 'Errore rimozione vino dal ristorante',
              );
            }

            continue;
          }

          const isMainEditedRow = wineRow.id === form.id;

          const payload = isMainEditedRow
            ? {
                ...form,
                id: wineRow.id,
                restaurantId: wineRow.restaurantId,
                availableByGlass: form.availableByGlass,
                glassPrice: form.availableByGlass ? form.glassPrice : '0',
                userId: loggedUser?.id,
              }
            : {
                id: wineRow.id,
                restaurantId: wineRow.restaurantId,

                name: form.name,
                producer: form.producer,
                region: form.region,
                denomination: form.denomination,
                vintage: form.vintage,
                category: form.category,
                alcohol: form.alcohol,
                format: form.format,
                notes: form.notes,
                pairings: form.pairings,
                grapeVarieties: form.grapeVarieties,

                userId: loggedUser?.id,
              };

          const patchResponse = await fetch('/api/wines', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const patchJson = await patchResponse.json();

          if (!patchResponse.ok) {
            throw new Error(patchJson.error || 'Errore modifica vino');
          }
        }

        const missingRestaurantIds = selectedRestaurantIds.filter(
          (restaurantId) => !existingRestaurantIds.includes(restaurantId),
        );

        for (const restaurantId of missingRestaurantIds) {
          const payload = {
            ...form,
            id: undefined,
            restaurantId,
            availableByGlass: form.availableByGlass,
            glassPrice: form.availableByGlass ? form.glassPrice : '0',
            userId: loggedUser?.id,
          };

          const postResponse = await fetch('/api/wines', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const postJson = await postResponse.json();

          if (!postResponse.ok) {
            throw new Error(postJson.error || 'Errore creazione vino');
          }
        }
      } else {
        for (const restaurantId of selectedRestaurantIds) {
          const payload = {
            ...form,
            id: undefined,
            restaurantId,
            availableByGlass: form.availableByGlass,
            glassPrice: form.availableByGlass ? form.glassPrice : '0',
            userId: loggedUser?.id,
          };

          const response = await fetch('/api/wines', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const json = await response.json();

          if (!response.ok) {
            throw new Error(json.error || 'Errore creazione vino');
          }
        }
      }

      setShowForm(false);
      setForm(emptyForm);
      setExtraRestaurantIds([]);
      setEditingWine(null);
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
    if (!canEdit) {
      setError('Non hai i permessi per eliminare vini');
      return;
    }

    const confirmed = window.confirm('Vuoi eliminare questo vino?');

    if (!confirmed) return;

    try {
      setError('');

      const params = new URLSearchParams({ id });

      if (loggedUser?.id) {
        params.set('userId', loggedUser.id);
      }

      const response = await fetch(`/api/wines?${params.toString()}`, {
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

  const updateForm = (key: keyof WineFormState, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const restaurantPresenceOptions = visibleRestaurants.filter(
    (restaurant) => restaurant.id !== form.restaurantId,
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

          <h1 className="text-2xl font-bold text-foreground">Magazzino</h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            {wines.length} etichette · {totals.totalBottles} bottiglie · valore
            vendita €{totals.sellingValue.toLocaleString('it-IT')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isManager && (
            <select
              value={selectedRestaurantId}
              onChange={(event) => handleRestaurantChange(event.target.value)}
              className="px-3 py-2.5 bg-card border border-border text-sm font-semibold rounded-lg outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="ALL">Tutti i ristoranti</option>

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
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-sm font-semibold rounded-lg hover:bg-secondary"
          >
            <RefreshCw size={16} />
            Aggiorna
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90"
            >
              <Plus size={16} />
              Aggiungi vino
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <StatCard label="Costo cantina" value={`€${totals.purchaseValue.toLocaleString('it-IT')}`} />
        <StatCard label="Valore vendita" value={`€${totals.sellingValue.toLocaleString('it-IT')}`} />
        <StatCard label="Margine potenziale" value={`€${totals.marginValue.toLocaleString('it-IT')}`} />
        <StatCard label="Da riordinare" value={totals.reorderCount} />
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
            placeholder="Cerca vino, vitigno, fornitore, produttore o ristorante..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(['TUTTI', 'ROSSO', 'BIANCO', 'ROSE', 'SPUMANTE', 'DOLCE'] as const).map(
            (item) => (
              <button
                type="button"
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Vino</th>
                {isManager && selectedRestaurantId === 'ALL' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Ristorante</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Fornitore</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Costo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Prezzo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Margine</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Stato</th>
                {canEdit && <th className="px-4 py-3 w-20" />}
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-border">
                    <td colSpan={9} className="px-4 py-4">
                      <div className="h-5 w-full max-w-md bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))}

              {!loading &&
                filtered.map((wine) => {
                  const margin = wine.bottlePrice - wine.purchasePrice;

                  return (
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
                              {wine.grapeVarieties ? ` · ${wine.grapeVarieties}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {isManager && selectedRestaurantId === 'ALL' && (
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {wine.restaurant?.name || 'Locale'}
                        </td>
                      )}

                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {wine.supplier || '-'}
                      </td>

                      <td className="px-4 py-3 text-sm font-bold">
                        {wine.stock}
                        <span className="text-xs text-muted-foreground font-normal">
                          {' '} / min {wine.minStock || 3}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        €{wine.purchasePrice}
                      </td>

                      <td className="px-4 py-3 text-sm font-bold">
                        €{wine.bottlePrice}
                      </td>

                      <td className="px-4 py-3 text-sm font-bold">
                        €{margin.toFixed(2)}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(wine.status)}`}>
                          {statusLabel(wine.status)}
                        </span>
                      </td>

                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(wine)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteWine(wine.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nessun vino trovato
            </div>
          )}
        </div>
      </div>

      {showForm && canEdit && (
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
                  I dati economici e di stock sono indipendenti per ogni ristorante.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                  setExtraRestaurantIds([]);
                  setEditingWine(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Ristorante principale
              </label>

              <select
                value={form.restaurantId}
                onChange={(event) => {
                  updateForm('restaurantId', event.target.value);
                  setExtraRestaurantIds((prev) =>
                    prev.filter((id) => id !== event.target.value),
                  );
                }}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="">Seleziona ristorante</option>

                {visibleRestaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.nome}
                  </option>
                ))}
              </select>
            </div>

            {visibleRestaurants.length > 1 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">
                  Presenza del vino negli altri ristoranti
                </label>

                <div className="grid md:grid-cols-2 gap-2">
                  {restaurantPresenceOptions.map((restaurant) => (
                    <label
                      key={restaurant.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={extraRestaurantIds.includes(restaurant.id)}
                        onChange={() => toggleExtraRestaurant(restaurant.id)}
                      />
                      {restaurant.nome}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <Input label="Nome" value={form.name} onChange={(v) => updateForm('name', v)} required />
              <Input label="Produttore" value={form.producer} onChange={(v) => updateForm('producer', v)} required />
              <Input label="Regione" value={form.region} onChange={(v) => updateForm('region', v)} required />
              <Input label="Denominazione" value={form.denomination} onChange={(v) => updateForm('denomination', v)} required />
              <Input label="Vitigni" value={form.grapeVarieties} onChange={(v) => updateForm('grapeVarieties', v)} placeholder="Es. Sangiovese, Merlot" />
              <Input label="Annata" type="number" value={form.vintage} onChange={(v) => updateForm('vintage', v)} required />

              <Input label="Stock" type="number" value={form.stock} onChange={(v) => updateForm('stock', v)} required />
              <Input label="Soglia minima stock" type="number" value={form.minStock} onChange={(v) => updateForm('minStock', v)} required />
              <Input label="Costo acquisto" type="number" value={form.purchasePrice} onChange={(v) => updateForm('purchasePrice', v)} required />
              <Input label="Prezzo bottiglia" type="number" value={form.bottlePrice} onChange={(v) => updateForm('bottlePrice', v)} required />
              <Input label="Fornitore" value={form.supplier} onChange={(v) => updateForm('supplier', v)} placeholder="Es. Meregalli, Cuzziol..." />
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

            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={form.availableByGlass}
                onChange={(event) =>
                  updateForm('availableByGlass', event.target.checked)
                }
              />
              Disponibile al calice
            </label>

            {form.availableByGlass && (
              <Input
                label="Prezzo calice"
                type="number"
                value={form.glassPrice}
                onChange={(v) => updateForm('glassPrice', v)}
                required
              />
            )}

            <Textarea label="Note" value={form.notes} onChange={(v) => updateForm('notes', v)} />
            <Textarea label="Abbinamenti" value={form.pairings} onChange={(v) => updateForm('pairings', v)} />

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
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                  setExtraRestaurantIds([]);
                  setEditingWine(null);
                }}
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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
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