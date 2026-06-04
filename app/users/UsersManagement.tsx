'use client';

import React, { useMemo, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Shield,
  User,
  Eye,
  Trash2,
  Edit2,
  Mail,
  Phone,
  Building2,
  X,
} from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';

type UserRole = 'Manager' | 'Sommelier' | 'Staff' | 'Ospite';
type UserStatus = 'Attivo' | 'Inattivo' | 'In attesa';

interface AppUser {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  ruolo: UserRole;
  status: UserStatus;
  ristorante: string;
  ultimoAccesso: string;
  avatar: string;
}

const USERS_MOCK: AppUser[] = [
  {
    id: 'u-001',
    nome: 'Marco',
    cognome: 'Santini',
    email: 'marco.santini@winecellardemo.it',
    telefono: '+39 02 1234567',
    ruolo: 'Manager',
    status: 'Attivo',
    ristorante: 'La Cantina di Marco',
    ultimoAccesso: '04/06/2026 10:52',
    avatar: 'MS',
  },
  {
    id: 'u-002',
    nome: 'Elena',
    cognome: 'Ricci',
    email: 'elena.ricci@winecellardemo.it',
    telefono: '+39 02 7654321',
    ruolo: 'Sommelier',
    status: 'Attivo',
    ristorante: 'La Cantina di Marco',
    ultimoAccesso: '04/06/2026 09:15',
    avatar: 'ER',
  },
  {
    id: 'u-003',
    nome: 'Luca',
    cognome: 'Bianchi',
    email: 'luca.bianchi@osteria.it',
    telefono: '+39 06 9876543',
    ruolo: 'Staff',
    status: 'Attivo',
    ristorante: 'Osteria del Borgo',
    ultimoAccesso: '03/06/2026 18:30',
    avatar: 'LB',
  },
];

const ROLE_COLORS: Record<UserRole, string> = {
  Manager: 'bg-primary/10 text-primary',
  Sommelier: 'bg-amber-100 text-amber-700',
  Staff: 'bg-blue-100 text-blue-700',
  Ospite: 'bg-muted text-muted-foreground',
};

const STATUS_COLORS: Record<UserStatus, string> = {
  Attivo: 'bg-green-100 text-green-700',
  Inattivo: 'bg-muted text-muted-foreground',
  'In attesa': 'bg-orange-100 text-orange-600',
};

const emptyUser: AppUser = {
  id: '',
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  ruolo: 'Staff',
  status: 'In attesa',
  ristorante: '',
  ultimoAccesso: '—',
  avatar: '',
};

function makeAvatar(nome: string, cognome: string) {
  return `${nome[0] ?? ''}${cognome[0] ?? ''}`.toUpperCase() || 'U';
}

export default function UsersManagement() {
  const { currentRestaurant } = useRestaurant();

  const [users, setUsers] = useState<AppUser[]>(USERS_MOCK);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'Tutti'>('Tutti');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch =
        u.nome.toLowerCase().includes(q) ||
        u.cognome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);

      const matchRole = filterRole === 'Tutti' || u.ruolo === filterRole;

      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  const totalActive = users.filter((u) => u.status === 'Attivo').length;
  const totalPending = users.filter((u) => u.status === 'In attesa').length;

  const handleSaveUser = (user: AppUser) => {
    const saved: AppUser = {
      ...user,
      id: user.id || `u-${Date.now()}`,
      ristorante: user.ristorante || currentRestaurant.nome,
      avatar: makeAvatar(user.nome, user.cognome),
    };

    setUsers((prev) => {
      const exists = prev.some((u) => u.id === saved.id);
      if (exists) return prev.map((u) => (u.id === saved.id ? saved : u));
      return [saved, ...prev];
    });

    setShowForm(false);
    setEditUser(null);
  };

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setOpenMenu(null);
  };

  const handleStatusChange = (id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  return (
    <div className="flex flex-col gap-6 p-6 xl:p-8 max-w-screen-2xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: currentRestaurant.colore }}
            >
              {currentRestaurant.logo}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {currentRestaurant.nome}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-foreground">Gestione Utenti</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} utenti registrati
          </p>
        </div>

        <button
          onClick={() => {
            setEditUser({
              ...emptyUser,
              ristorante: currentRestaurant.nome,
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-sm"
        >
          <Plus size={16} />
          Invita Utente
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Totale Utenti', value: users.length, icon: Users, color: 'bg-primary/10 text-primary' },
          { label: 'Attivi', value: totalActive, icon: User, color: 'bg-green-100 text-green-700' },
          { label: 'In Attesa', value: totalPending, icon: Mail, color: 'bg-orange-100 text-orange-600' },
          { label: 'Ristoranti', value: 3, icon: Building2, color: 'bg-blue-100 text-blue-700' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca utente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['Tutti', 'Manager', 'Sommelier', 'Staff', 'Ospite'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterRole === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Utente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ruolo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Ristorante</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">Contatto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Ultimo Accesso</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>

            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <span className="text-primary text-xs font-bold">{u.avatar}</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {u.nome} {u.cognome}
                        </div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.ruolo]}`}>
                      <Shield size={10} />
                      {u.ruolo}
                    </span>
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">{u.ristorante}</span>
                  </td>

                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone size={12} />
                      {u.telefono || '—'}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={u.status}
                      onChange={(e) => handleStatusChange(u.id, e.target.value as UserStatus)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 outline-none ${STATUS_COLORS[u.status]}`}
                    >
                      <option value="Attivo">Attivo</option>
                      <option value="Inattivo">Inattivo</option>
                      <option value="In attesa">In attesa</option>
                    </select>
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{u.ultimoAccesso}</span>
                  </td>

                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <MoreVertical size={15} />
                    </button>

                    {openMenu === u.id && (
                      <div className="absolute right-4 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 min-w-[150px] overflow-hidden">
                        <button
                          onClick={() => {
                            setViewUser(u);
                            setOpenMenu(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-foreground hover:bg-secondary"
                        >
                          <Eye size={13} />
                          Visualizza
                        </button>

                        <button
                          onClick={() => {
                            setEditUser(u);
                            setShowForm(true);
                            setOpenMenu(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-foreground hover:bg-secondary"
                        >
                          <Edit2 size={13} />
                          Modifica
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                          Rimuovi
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Nessun utente trovato
            </div>
          )}
        </div>
      </div>

      {viewUser && (
        <UserViewModal user={viewUser} onClose={() => setViewUser(null)} />
      )}

      {showForm && editUser && (
        <UserFormModal
          user={editUser}
          onClose={() => {
            setShowForm(false);
            setEditUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}

function UserViewModal({
  user,
  onClose,
}: {
  user: AppUser;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Dettaglio Utente</h2>
            <p className="text-xs text-muted-foreground">
              Informazioni complete dell’utente
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
            <span className="text-primary font-bold">{user.avatar}</span>
          </div>
          <div>
            <p className="font-bold text-foreground">
              {user.nome} {user.cognome}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm">
          <InfoRow label="Ruolo" value={user.ruolo} />
          <InfoRow label="Stato" value={user.status} />
          <InfoRow label="Telefono" value={user.telefono || '—'} />
          <InfoRow label="Ristorante" value={user.ristorante} />
          <InfoRow label="Ultimo accesso" value={user.ultimoAccesso} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}

function UserFormModal({
  user,
  onClose,
  onSave,
}: {
  user: AppUser;
  onClose: () => void;
  onSave: (user: AppUser) => void;
}) {
  const [form, setForm] = useState<AppUser>(user);

  const update = (key: keyof AppUser, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6 fade-in flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {user.id ? 'Modifica Utente' : 'Invita Utente'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Gestisci dati, ruolo e stato dell’utente
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Nome" value={form.nome} onChange={(v) => update('nome', v)} required />
          <Input label="Cognome" value={form.cognome} onChange={(v) => update('cognome', v)} required />
        </div>

        <Input label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} required />
        <Input label="Telefono" value={form.telefono} onChange={(v) => update('telefono', v)} />
        <Input label="Ristorante" value={form.ristorante} onChange={(v) => update('ristorante', v)} required />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Ruolo</label>
            <select
              value={form.ruolo}
              onChange={(e) => update('ruolo', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="Manager">Manager</option>
              <option value="Sommelier">Sommelier</option>
              <option value="Staff">Staff</option>
              <option value="Ospite">Ospite</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Stato</label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="Attivo">Attivo</option>
              <option value="Inattivo">Inattivo</option>
              <option value="In attesa">In attesa</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary rounded-lg"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90"
          >
            Salva
          </button>
        </div>
      </form>
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
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
      />
    </div>
  );
}