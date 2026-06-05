'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  CreditCard,
  Crown,
  KeyRound,
  Lock,
  Mail,
  Shield,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';

type Plan = 'FREE' | 'PRO' | 'PLUS';

type LoggedUser = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  role: 'MANAGER' | 'SOMMELIER' | 'STAFF';
  companyId: string;
  companyName?: string;
  inviteKey?: string | null;
  plan?: Plan;
};

const PLANS: {
  id: Plan;
  name: string;
  price: string;
  description: string;
  badge?: string;
  features: string[];
}[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: '€0',
    description: 'Per iniziare a gestire una piccola cantina.',
    features: [
      '1 società',
      '1 ristorante',
      'Fino a 50 vini',
      'Menù digitale base',
      'Gestione utenti limitata',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '€19/mese',
    description: 'Per ristoranti e wine bar con gestione completa.',
    badge: 'Consigliato',
    features: [
      'Ristoranti multipli',
      'Vini illimitati',
      'Report avanzati',
      'Gestione staff e sommelier',
      'Menù QR professionale',
    ],
  },
  {
    id: 'PLUS',
    name: 'Plus',
    price: '€49/mese',
    description: 'Per gruppi, catene e gestione multi-sede.',
    features: [
      'Multi-società',
      'Audit e log attività',
      'Supporto prioritario',
      'Export avanzati',
      'Funzioni enterprise',
    ],
  },
];

export default function SettingsScreen() {
  const [user, setUser] = useState<LoggedUser | null>(null);
  const [activePlan, setActivePlan] = useState<Plan>('FREE');

  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('winecellar_user');

    if (!savedUser) return;

    try {
      const parsed = JSON.parse(savedUser) as LoggedUser;

      setUser(parsed);
      setNome(parsed.nome || '');
      setCognome(parsed.cognome || '');
      setCompanyName(parsed.companyName || '');
      setActivePlan(parsed.plan || 'FREE');

      loadProfile(parsed.id);
    } catch {
      localStorage.removeItem('winecellar_user');
    }
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/settings/profile?userId=${userId}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore caricamento profilo');
      }

      localStorage.setItem('winecellar_user', JSON.stringify(json.user));

      setUser(json.user);
      setNome(json.user.nome || '');
      setCognome(json.user.cognome || '');
      setCompanyName(json.user.companyName || '');
      setActivePlan(json.user.plan || 'FREE');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Errore caricamento profilo',
      );
    }
  };

  const saveProfile = async () => {
    if (!user?.id) {
      setMessage('Sessione non valida. Effettua di nuovo il login.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          nome,
          cognome,
          companyName,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore aggiornamento profilo');
      }

      localStorage.setItem('winecellar_user', JSON.stringify(json.user));
      setUser(json.user);
      setActivePlan(json.user.plan || 'FREE');

      setMessage('Profilo aggiornato correttamente.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Errore durante il salvataggio profilo',
      );
    } finally {
      setLoading(false);
    }
  };

const changePlan = async (plan: Plan) => {
  if (!user?.id || !user.companyId) {
    setMessage('Sessione non valida. Effettua di nuovo il login.');
    return;
  }

  try {
    setLoading(true);
    setMessage('');

    const response = await fetch('/api/billing/plan', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        companyId: user.companyId,
        plan,
      }),
    });

    const text = await response.text();

    let json: {
      success?: boolean;
      plan?: Plan;
      error?: string;
      details?: string;
      message?: string;
    } = {};

    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        console.error('RISPOSTA NON JSON DA /api/billing/plan:', text);
        throw new Error(
          'La API /api/billing/plan non sta restituendo JSON. Controlla che il file route.ts esista nel percorso corretto.',
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        json.details ||
          json.error ||
          `Errore API /api/billing/plan: ${response.status}`,
      );
    }

    const updatedUser: LoggedUser = {
      ...user,
      plan: json.plan || plan,
    };

    localStorage.setItem('winecellar_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setActivePlan(json.plan || plan);

    setMessage(json.message || `Piano aggiornato a ${json.plan || plan}.`);
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : 'Errore durante aggiornamento piano',
    );
  } finally {
    setLoading(false);
  }
};

  const changePassword = async () => {
    if (!user?.id) {
      setMessage('Sessione non valida. Effettua di nuovo il login.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('Compila tutti i campi password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('La nuova password e la conferma non coincidono.');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('La nuova password deve avere almeno 8 caratteri.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch('/api/settings/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore aggiornamento password');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setMessage('Password aggiornata correttamente.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Errore durante il cambio password',
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user?.id || !user.companyId) {
      setMessage('Sessione non valida. Effettua di nuovo il login.');
      return;
    }

    if (deleteConfirm !== 'CANCELLA') {
      setMessage('Per confermare devi scrivere CANCELLA.');
      return;
    }

    const confirmed = window.confirm(
      'Confermi la cancellazione definitiva dell’account?',
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          companyId: user.companyId,
          confirmText: deleteConfirm,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore cancellazione account');
      }

      localStorage.removeItem('winecellar_user');
      localStorage.removeItem('winecellar_current_restaurant');

      window.location.href = '/landing';
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Errore durante cancellazione account',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 xl:p-8 max-w-screen-2xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground font-medium">
            Account e società
          </span>
        </div>

        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestisci piano, dati account, password e cancellazione.
        </p>
      </div>

      {message && (
        <div className="bg-primary/5 border border-primary/20 text-primary rounded-xl px-4 py-3 text-sm font-semibold">
          {message}
        </div>
      )}

      <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard size={17} />
              <h2 className="font-bold text-foreground">Abbonamento</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Scegli il piano più adatto alla tua attività.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
            Piano attuale: {activePlan}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 p-5">
          {PLANS.map((plan) => {
            const active = activePlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-5 flex flex-col gap-4 ${
                  active
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background'
                }`}
              >
                {plan.badge && (
                  <div className="absolute right-4 top-4 bg-primary text-primary-foreground text-[11px] font-bold px-2 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    {plan.id === 'FREE' && <Sparkles size={18} />}
                    {plan.id === 'PRO' && <BadgeCheck size={18} />}
                    {plan.id === 'PLUS' && <Crown size={18} />}

                    <h3 className="font-bold text-lg text-foreground">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="text-2xl font-bold text-foreground mt-3">
                    {plan.price}
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Check size={14} className="text-green-600" />
                      {feature}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => changePlan(plan.id)}
                  disabled={loading || active}
                  className={`mt-auto px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60 ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border hover:bg-secondary'
                  }`}
                >
                  {active ? 'Piano attivo' : `Passa a ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={17} />
            <h2 className="font-bold text-foreground">Dati account</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome" value={nome} onChange={setNome} />
            <Input label="Cognome" value={cognome} onChange={setCognome} />
          </div>

          <div className="mt-3">
            <Input
              label="Email"
              value={user?.email || ''}
              onChange={() => undefined}
              disabled
              icon={<Mail size={14} />}
            />
          </div>

          <div className="mt-3">
            <Input
              label="Società"
              value={companyName}
              onChange={setCompanyName}
              icon={<Building2 size={14} />}
            />
          </div>

          <button
            onClick={saveProfile}
            disabled={loading}
            className="mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={17} />
            <h2 className="font-bold text-foreground">Sicurezza</h2>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              label="Password attuale"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              icon={<Lock size={14} />}
            />

            <Input
              label="Nuova password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              icon={<Lock size={14} />}
            />

            <Input
              label="Conferma nuova password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              icon={<Lock size={14} />}
            />
          </div>

          <button
            onClick={changePassword}
            disabled={loading}
            className="mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
          >
            Aggiorna password
          </button>
        </div>
      </section>

      <section className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>

            <div>
              <h2 className="font-bold text-red-800">Zona pericolosa</h2>
              <p className="text-sm text-red-700 mt-1 max-w-2xl">
                La cancellazione account eliminerà utente, società, ristoranti,
                vini, report e dati collegati. Scrivi CANCELLA per confermare.
              </p>

              <input
                value={deleteConfirm}
                onChange={(event) => setDeleteConfirm(event.target.value)}
                placeholder="Scrivi CANCELLA"
                className="mt-3 w-full max-w-xs px-3 py-2 rounded-lg border border-red-300 bg-white text-sm outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
          </div>

          <button
            onClick={deleteAccount}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-60"
          >
            <Trash2 size={16} />
            Cancella account
          </button>
        </div>
      </section>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary ${
            icon ? 'pl-9' : ''
          } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}