'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Copy, Check } from 'lucide-react';

type RegisterRole = 'MANAGER' | 'STAFF' | 'SOMMELIER';

interface SignUpFormData {
  nome: string;
  cognome: string;
  email: string;
  struttura: string;
  role: RegisterRole;
  companyKey: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export default function SignUpForm() {
  const [step, setStep] = useState<'form' | 'verify' | 'done'>('form');
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
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      role: 'MANAGER',
      terms: false,
    },
  });

  const role = watch('role');
  const password = watch('password');

  async function onSubmit(data: SignUpFormData) {
    setServerError('');

    if (data.password !== data.confirmPassword) {
      setServerError('Le password non corrispondono');
      return;
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error || 'Errore durante la registrazione');
      return;
    }

    setEmailToVerify(data.email);
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

    const json = await res.json();

    setLoadingVerify(false);

    if (!res.ok) {
      setServerError(json.error || 'Codice non valido');
      return;
    }

    setResult(json.user);
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
        <p className="text-sm font-semibold text-foreground mt-1">{emailToVerify}</p>

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
        <h2 className="text-2xl font-bold text-foreground">Iscrizione inviata</h2>
        <p className="text-sm text-muted-foreground mt-2">
          La tua email è stata verificata correttamente.
        </p>

        <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Registrazione completata per {result?.companyName}.
        </div>

        {result?.role === 'MANAGER' && result?.inviteKey && (
          <div className="mt-6 border border-border rounded-xl p-4 bg-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Codice azienda per collaboratori
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
              Dai questo codice ai collaboratori. Lo inseriranno in fase di registrazione
              per collegarsi alla tua azienda.
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
          Registra la tua struttura su WineCellar
        </p>
      </div>

      {serverError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">Tipo account</label>
          <select
            className="w-full px-3.5 py-2.5 rounded-lg border text-sm bg-card text-foreground outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary border-border"
            {...register('role')}
          >
            <option value="MANAGER">Manager / Proprietario</option>
            <option value="SOMMELIER">Sommelier</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>

        {role === 'MANAGER' ? (
          <Input
            label="Nome azienda / struttura"
            placeholder="Ristorante La Vigna"
            error={errors.struttura?.message}
            {...register('struttura', {
              required: role === 'MANAGER' ? 'Nome struttura obbligatorio' : false,
            })}
          />
        ) : (
          <Input
            label="Codice azienda"
            placeholder="WC-A1B2C3D4"
            error={errors.companyKey?.message}
            {...register('companyKey', {
              required: role !== 'MANAGER' ? 'Codice azienda obbligatorio' : false,
            })}
          />
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
          <p className="text-xs text-red-600 -mt-2">{errors.terms.message}</p>
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
          ) : (
            'Crea account'
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