'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: { remember: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error || 'Credenziali non valide');
      return;
    }

    localStorage.setItem('winecellar_user', JSON.stringify(json.user));

    router.push('/dashboard');
  };

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Bentornato</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Accedi al pannello di gestione della cantina
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {serverError}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="nome@ristorante.it"
            autoComplete="email"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-card text-foreground placeholder:text-muted-foreground outline-none transition-all duration-150 focus:ring-2 focus:ring-ring/40 focus:border-primary ${
              errors.email ? 'border-red-400' : 'border-border'
            }`}
            {...register('email', {
              required: 'Email obbligatoria',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Email non valida' },
            })}
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-0.5">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground" htmlFor="login-password">
            Password
          </label>

          <div className="relative">
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm bg-card text-foreground placeholder:text-muted-foreground outline-none transition-all duration-150 focus:ring-2 focus:ring-ring/40 focus:border-primary ${
                errors.password ? 'border-red-400' : 'border-border'
              }`}
              {...register('password', {
                required: 'Password obbligatoria',
              })}
            />

            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPw ? 'Nascondi password' : 'Mostra password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {errors.password && (
            <p className="text-xs text-red-600 mt-0.5">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border accent-primary"
              {...register('remember')}
            />
            <span className="text-sm text-muted-foreground">Ricordami</span>
          </label>

          <button type="button" className="text-sm text-primary hover:underline font-medium">
            Password dimenticata?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Accesso in corso…
            </>
          ) : (
            'Accedi'
          )}
        </button>
      </form>

      <div className="mt-6 border border-border rounded-xl p-4 bg-muted/40">
        <p className="text-xs text-muted-foreground">
          Usa l’email e la password create durante la registrazione. Gli account demo sono stati disattivati.
        </p>
      </div>
    </div>
  );
}