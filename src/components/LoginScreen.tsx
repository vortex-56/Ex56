import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, CheckCircle2, Shield, User, ArrowRight, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onEnterAsGuest?: () => void;
  errorMsg?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onEnterAsGuest, errorMsg }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorMsg || null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const redirectUrl = window.location.href.split('#')[0].split('?')[0];
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        console.error('Error al conectar con Google OAuth:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error inesperado de autenticación:', err);
      setError(err?.message || 'Error inesperado al conectar con Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Top minimal brand bar (Tema Blanco) */}
      <header className="px-6 py-4 bg-white/90 backdrop-blur-xs border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 border border-amber-300 flex items-center justify-center text-slate-950 shadow-xs">
            <Calendar className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-950">Ex56</span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300/80 font-bold">
            Gestión Matricial
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Autenticación Segura con Google</span>
        </div>
      </header>

      {/* Main Login Card (Tema Blanco con sombra suave y bordes redondeados) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle warm accent bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

          <div className="space-y-6 pt-1">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-xs mb-1">
                <Calendar className="w-7 h-7 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Iniciar sesión en Ex56
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Control de hábitos, matriz de actividades y registro financiero sincronizado en tu base de datos de Supabase.
              </p>
            </div>

            {/* Error display if any */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <span className="font-bold shrink-0">Aviso:</span>
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons Section */}
            <div className="space-y-3 pt-1">
              {/* Botón Principal: Iniciar sesión con Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full relative flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 shadow-xs hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {/* Official Google G Logo SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Conectando con Google...' : 'Iniciar sesión con Google'}</span>
              </button>

              {/* Separador discreto */}
              <div className="relative flex items-center justify-center my-3.5">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  o también
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Botón Secundario: Entrar como invitado */}
              <button
                type="button"
                onClick={onEnterAsGuest}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200/90 transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Entrar como invitado</span>
              </button>
              
              <p className="text-[11px] text-center text-slate-400">
                Los datos del modo invitado se guardan solo en este navegador.
              </p>
            </div>

            {/* Feature highlights list sobre fondo claro */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span>Proyectos y actividades organizados en matriz dinámica</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <div className="w-4 h-4 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span>Métricas de hábitos, control de finanzas y módulo de ideas</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <div className="w-4 h-4 rounded-full bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span>Sincronización en la nube con Supabase o modo local</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 bg-white/50 border-t border-slate-200 text-center text-xs text-slate-500">
        Ex56 &copy; {new Date().getFullYear()} — Plataforma de productividad matricial
      </footer>
    </div>
  );
};
