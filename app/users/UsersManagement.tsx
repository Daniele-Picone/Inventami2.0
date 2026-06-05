'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Shield,
  User,
  Eye,
  Mail,
  Building2,
  X,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';

type ApiRole = 'MANAGER' | 'SOMMELIER' | 'STAFF';
type UserRole = 'Manager' | 'Sommelier' | 'Staff';
type UserStatus = 'Attivo' | 'In attesa';

interface LoggedUser {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  role: ApiRole;
  companyId: string;
  companyName?: string;
  inviteKey?: string | null;
}

interface ApiUser {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  role: ApiRole;
  verified: boolean;
  createdAt: string;
  company?: {
    id: string;
    name: string;
    inviteKey: string;
  };
}

interface AppUser {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: UserRole;
  status: UserStatus;
  azienda: string;
  dataCreazione: string;
  avatar: string;
  inviteKey?: string;
}

const ROLE_COLORS: Record<UserRole, string> = {
  Manager: 'bg-primary/10 text-primary',
  Sommelier: 'bg-amber-100 text-amber-700',
  Staff: 'bg-blue-100 text-blue-700',
};

const STATUS_COLORS: Record<UserStatus, string> = {
  Attivo: 'bg-green-100 text-green-700',
  'In attesa': 'bg-orange-100 text-orange-600',
};

function makeAvatar(nome: string, cognome: string) {
  return `${nome?.[0] ?? ''}${cognome?.[0] ?? ''}`.toUpperCase() || 'U';
}

function roleLabel(role: ApiRole): UserRole {
  if (role === 'MANAGER') return 'Manager';
  if (role === 'SOMMELIER') return 'Sommelier';
  return 'Staff';
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '—';
  }
}

function mapApiUser(user: ApiUser): AppUser {
  return {
    id: user.id,
    nome: user.nome,
    cognome: user.cognome,
    email: user.email,
    ruolo: roleLabel(user.role),
    status: user.verified ? 'Attivo' : 'In attesa',
    azienda: user.company?.name ?? '—',
    dataCreazione: formatDate(user.createdAt),
    avatar: makeAvatar(user.nome, user.cognome),
    inviteKey: user.company?.inviteKey,
  };
}

export default function UsersManagement() {
  const { currentRestaurant, restaurants } = useRestaurant();

  const [loggedUser, setLoggedUser] = useState<LoggedUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'Tutti'>('Tutti');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const companyId = loggedUser?.companyId;
  const isManager = loggedUser?.role === 'MANAGER';
  const inviteKey =
    loggedUser?.inviteKey || users.find((user) => user.inviteKey)?.inviteKey;

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

  const loadUsers = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/users?companyId=${companyId}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore caricamento utenti');
      }

      setUsers(json.users.map(mapApiUser));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Errore durante il caricamento utenti',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const q = search.toLowerCase();

      const matchSearch =
        user.nome.toLowerCase().includes(q) ||
        user.cognome.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);

      const matchRole = filterRole === 'Tutti' || user.ruolo === filterRole;

      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  const totalActive = users.filter((user) => user.status === 'Attivo').length;
  const totalPending = users.filter((user) => user.status === 'In attesa').length;
  const totalManagers = users.filter((user) => user.ruolo === 'Manager').length;

  const copyInviteKey = async () => {
    if (!inviteKey) return;

    await navigator.clipboard.writeText(inviteKey);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1600);
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
              {loggedUser?.companyName ||
                currentRestaurant?.nome ||
                'WineCellar'}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            Gestione Utenti
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} utenti registrati nella tua azienda
          </p>
        </div>

        {isManager && (
          <button
            onClick={copyInviteKey}
            disabled={!inviteKey}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <Check size={16} /> : <Plus size={16} />}
            {copied ? 'Codice copiato' : 'Invita Utente'}
          </button>
        )}
      </div>

      {isManager && inviteKey && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-bold text-foreground">
              Codice azienda per invitare collaboratori
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Staff e Sommelier possono registrarsi usando questo codice.
            </p>
          </div>

          <button
            onClick={copyInviteKey}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm font-bold text-foreground hover:bg-secondary"
          >
            <span>{inviteKey}</span>
            {copied ? (
              <Check size={15} className="text-green-600" />
            ) : (
              <Copy size={15} />
            )}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Totale Utenti',
            value: users.length,
            icon: Users,
            color: 'bg-primary/10 text-primary',
          },
          {
            label: 'Attivi',
            value: totalActive,
            icon: User,
            color: 'bg-green-100 text-green-700',
          },
          {
            label: 'In Attesa',
            value: totalPending,
            icon: Mail,
            color: 'bg-orange-100 text-orange-600',
          },
          {
            label: 'Manager',
            value: totalManagers,
            icon: Building2,
            color: 'bg-blue-100 text-blue-700',
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}
              >
                <Icon size={18} />
              </div>

              <div>
                <div className="text-xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              type="text"
              placeholder="Cerca utente..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['Tutti', 'Manager', 'Sommelier', 'Staff'] as const).map(
              (role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    filterRole === role
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {role}
                </button>
              ),
            )}
          </div>
        </div>

        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
        >
          <RefreshCw size={14} />
          Aggiorna
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Utente
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Ruolo
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                  Azienda
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Stato
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                  Registrato il
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="px-4 py-4" colSpan={6}>
                      <div className="h-5 w-full max-w-md bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))}

              {!loading &&
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <span className="text-primary text-xs font-bold">
                            {user.avatar}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {user.nome} {user.cognome}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user.ruolo]}`}
                      >
                        <Shield size={10} />
                        {user.ruolo}
                      </span>
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {user.azienda}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[user.status]}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {user.dataCreazione}
                      </span>
                    </td>

                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === user.id ? null : user.id)
                        }
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <MoreVertical size={15} />
                      </button>

                      {openMenu === user.id && (
                        <div className="absolute right-4 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 min-w-[150px] overflow-hidden">
                          <button
                            onClick={() => {
                              setViewUser(user);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-foreground hover:bg-secondary"
                          >
                            <Eye size={13} />
                            Visualizza
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Nessun utente trovato
            </div>
          )}
        </div>
      </div>

      {viewUser && (
        <UserViewModal user={viewUser} onClose={() => setViewUser(null)} />
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
            <h2 className="text-lg font-bold text-foreground">
              Dettaglio Utente
            </h2>
            <p className="text-xs text-muted-foreground">
              Informazioni complete dell’utente
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
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
          <InfoRow label="Azienda" value={user.azienda} />
          <InfoRow label="Registrato il" value={user.dataCreazione} />
          {user.inviteKey && (
            <InfoRow label="Codice azienda" value={user.inviteKey} />
          )}
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