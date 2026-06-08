'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Copy, Check, Building2, KeyRound } from 'lucide-react';

type RegisterRole = 'MANAGER' | 'STAFF' | 'SOMMELIER';
type RegisterMode = 'CREATE_COMPANY' | 'JOIN_COMPANY';

interface SignUpFormData {
  nome: string;
  cognome: string;
  email: string;
  struttura: string;
  restaurantName: string;
  role: RegisterRole;
  companyKey: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export default function SignUpForm() {
  const [step, setStep] = useState<'form' | 'verify' | 'done'>('form');
  const [registerMode, setRegisterMode] =
    useState<RegisterMode>('CREATE_COMPANY');

  const [serverError, setServerError] = useState('');
  const [emailToVerify, setEmailToVerify] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{
    companyName?: string;
    inviteKey?: string | null;
    role?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      role: 'MANAGER',
      terms: false,
      restaurantName: '',
      companyKey: '',
    },
  });

  const role = watch('role');
  const password = watch('password');

  function switchToCreateCompany() {
    setRegisterMode('CREATE_COMPANY');
    setValue('role', 'MANAGER');
    setValue('companyKey', '');
    setServerError('');
  }

  function switchToJoinCompany() {
    setRegisterMode('JOIN_COMPANY');
    setValue('role', 'STAFF');
    setValue('struttura', '');
    setValue('restaurantName', '');
    setServerError('');
  }

  async function onSubmit(data: SignUpFormData) {
    setServerError('');

    if (data.password !== data.confirmPassword) {
      setServerError('Le password non corrispondono');
      return;
    }

    if (registerMode === 'CREATE_COMPANY' && !data.struttura.trim()) {
      setServerError('Inserisci il nome della società');
      return;
    }

    if (registerMode === 'JOIN_COMPANY' && !data.companyKey.trim()) {
      setServerError('Inserisci il codice invito');
      return;
    }

    const payload = {
      nome: data.nome.trim(),
      cognome: data.cognome.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: registerMode === 'CREATE_COMPANY' ? 'MANAGER' : data.role,

      companyName:
        registerMode === 'CREATE_COMPANY'
          ? data.struttura.trim()
          : undefined,

      restaurantName:
        registerMode === 'CREATE_COMPANY'
          ? data.restaurantName.trim()
          : undefined,

      inviteKey:
        registerMode === 'JOIN_COMPANY'
          ? data.companyKey.trim().toUpperCase()
          : undefined,

      // compatibilità con vecchia API, se ancora usa questi nomi
      struttura:
        registerMode === 'CREATE_COMPANY'
          ? data.struttura.trim()
          : undefined,

      companyKey:
        registerMode === 'JOIN_COMPANY'
          ? data.companyKey.trim().toUpperCase()
          : undefined,
    };

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    let json: {
      error?: string;
      details?: string;
    } = {};

    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        console.error('RISPOSTA NON JSON DA /api/auth/register:', text);
        setServerError(
          'La API /api/auth/register non sta restituendo JSON valido.',
        );
        return;
      }
    }

    if (!res.ok) {
      setServerError(
        json.details || json.error || 'Errore durante la registrazione',
      );
      return;
    }

    setEmailToVerify(data.email.trim().toLowerCase());
    setStep('verify');
  }

  async function verifyCode() {
    setServerError('');
    setLoadingVerify(true);

    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToVerify, code }),
    });

    const text = await res.text();

    let json: {
      error?: string;
      user?: {
        companyName?: string;
        inviteKey?: string | null;
        role?: string;
      };
    } = {};

    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        setLoadingVerify(false);
        setServerError(
          'La API /api/auth/verify-code non sta restituendo JSON valido.',
        );
        return;
      }
    }

    setLoadingVerify(false);

    if (!res.ok) {
      setServerError(json.error || 'Codice non valido');
      return;
    }

    setResult(json.user || null);
    setStep('done');
  }

  function copyKey() {
    if (!result?.inviteKey) return;
    navigator.clipboard.writeText(result.inviteKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (step === 'verify') {
    return (
      <div className="fade-in">
        <h2 className="text-2xl font-bold text-foreground">Conferma email</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Abbiamo inviato un codice a:
        </p>
        <p className="text-sm font-semibold text-foreground mt-1">
          {emailToVerify}
        </p>

        {serverError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {serverError}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">
            Codice di verifica
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            placeholder="123456"
            className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary border-border tracking-[0.4em] text-center font-bold"
          />
        </div>

        <button
          type="button"
          onClick={verifyCode}
          disabled={loadingVerify || code.length < 6}
          className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60"
        >
          {loadingVerify ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifica…
            </>
          ) : (
            'Conferma iscrizione'
          )}
        </button>

        <button
          type="button"
          onClick={() => setStep('form')}
          className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground"
        >
          Torna indietro
        </button>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="fade-in">
        <h2 className="text-2xl font-bold text-foreground">
          Iscrizione completata
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          La tua email è stata verificata correttamente.
        </p>

        <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Registrazione completata per {result?.companyName || 'WineCellar'}.
        </div>

        {result?.role === 'MANAGER' && result?.inviteKey && (
          <div className="mt-6 border border-border rounded-xl p-4 bg-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Codice invito società
            </p>

            <div className="mt-2 flex items-center justify-between gap-3 bg-muted px-3 py-2 rounded-lg">
              <span className="font-bold text-primary tracking-wide">
                {result.inviteKey}
              </span>
              <button
                type="button"
                onClick={copyKey}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiato' : 'Copia'}
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Dai questo codice a staff e sommelier. Lo useranno in fase di
              registrazione per entrare nella tua società.
            </p>
          </div>
        )}

        <a
          href="/sign-up-login-screen"
          className="mt-6 flex items-center justify-center w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90"
        >
          Vai al login
        </a>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Crea account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Crea una società o entra con un codice invito
        </p>
      </div>

      {serverError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={switchToCreateCompany}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
              registerMode === 'CREATE_COMPANY'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Building2 size={15} />
            Crea società
          </button>

          <button
            type="button"
            onClick={switchToJoinCompany}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
              registerMode === 'JOIN_COMPANY'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <KeyRound size={15} />
            Codice invito
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nome"
            placeholder="Marco"
            error={errors.nome?.message}
            {...register('nome', { required: 'Obbligatorio' })}
          />
          <Input
            label="Cognome"
            placeholder="Santini"
            error={errors.cognome?.message}
            {...register('cognome', { required: 'Obbligatorio' })}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="nome@ristorante.it"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email obbligatoria',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Email non valida' },
          })}
        />

        {registerMode === 'CREATE_COMPANY' ? (
          <>
            <Input
              label="Nome società"
              placeholder="Es. Gruppo La Vigna"
              error={errors.struttura?.message}
              {...register('struttura', {
                required:
                  registerMode === 'CREATE_COMPANY'
                    ? 'Nome società obbligatorio'
                    : false,
              })}
            />

            <Input
              label="Primo ristorante"
              placeholder="Es. Ristorante La Vigna"
              error={errors.restaurantName?.message}
              {...register('restaurantName')}
            />

            <input type="hidden" value="MANAGER" {...register('role')} />
          </>
        ) : (
          <>
            <Input
              label="Codice invito società"
              placeholder="Es. A1B2C3D4"
              error={errors.companyKey?.message}
              className="uppercase tracking-widest"
              {...register('companyKey', {
                required: 'Codice invito obbligatorio',
                onChange: (event) => {
                  event.target.value = event.target.value.toUpperCase();
                },
              })}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Ruolo
              </label>
              <select
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-card text-foreground outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary border-border"
                {...register('role')}
              >
                <option value="STAFF">Staff</option>
                <option value="SOMMELIER">Sommelier</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Il codice deve essere fornito dal manager della società.
              </p>
            </div>
          </>
        )}

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password obbligatoria',
            minLength: { value: 8, message: 'Minimo 8 caratteri' },
          })}
        />

        <Input
          label="Conferma password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Conferma la password',
            validate: (v) => v === password || 'Le password non corrispondono',
          })}
        />

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded border-border accent-primary shrink-0"
            {...register('terms', { required: 'Devi accettare i termini' })}
          />
          <span className="text-sm text-muted-foreground">
            Accetto i Termini di Servizio e la Privacy Policy
          </span>
        </label>

        {errors.terms && (
          <p className="text-xs text-red-600 -mt-2">
            {errors.terms.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Invio codice…
            </>
          ) : registerMode === 'CREATE_COMPANY' ? (
            'Crea società'
          ) : (
            'Entra con codice invito'
          )}
        </button>
      </form>
    </div>
  );
}

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
  }
>(function Input({ label, error, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <input
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-all ${
          error ? 'border-red-400' : 'border-border'
        } ${className ?? ''}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});