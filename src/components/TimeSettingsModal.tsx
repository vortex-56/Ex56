import React, { useState } from 'react';
import { formatDateToYYYYMMDD, parseYYYYMMDD, getTodayDateString } from '../utils/dateUtils';
import { CalendarDays, X, Check, Clock } from 'lucide-react';

interface TimeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date;
  endDate: Date;
  onApplyRange: (start: Date, end: Date) => void;
}

export const TimeSettingsModal: React.FC<TimeSettingsModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onApplyRange,
}) => {
  const [startStr, setStartStr] = useState(() => formatDateToYYYYMMDD(startDate));
  const [endStr, setEndStr] = useState(() => formatDateToYYYYMMDD(endDate));

  if (!isOpen) return null;

  // Calculate day difference
  const s = parseYYYYMMDD(startStr);
  const e = parseYYYYMMDD(endStr);
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const handleApplyPreset = (daysCount: number) => {
    const newStart = parseYYYYMMDD(startStr);
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + daysCount - 1);
    setEndStr(formatDateToYYYYMMDD(newEnd));
  };

  const handleSetFromToday = () => {
    const today = new Date();
    setStartStr(formatDateToYYYYMMDD(today));
    const newEnd = new Date(today);
    newEnd.setDate(today.getDate() + 13); // Default 14 days
    setEndStr(formatDateToYYYYMMDD(newEnd));
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const finalStart = parseYYYYMMDD(startStr);
    const finalEnd = parseYYYYMMDD(endStr);
    if (finalStart > finalEnd) {
      onApplyRange(finalStart, finalStart);
    } else {
      onApplyRange(finalStart, finalEnd);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Establecer Tiempos
              </h2>
              <p className="text-[11px] text-slate-500">
                Define el rango de fechas que deseas visualizar en la matriz.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Opciones Rápidas</label>
              <button
                type="button"
                onClick={handleSetFromToday}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
              >
                Comenzar desde hoy
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(7)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  diffDays === 7
                    ? 'border-amber-400 bg-amber-100 text-amber-950 shadow-2xs ring-1 ring-amber-400/40'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-amber-50/50'
                }`}
              >
                7 Días
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(14)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  diffDays === 14
                    ? 'border-amber-400 bg-amber-100 text-amber-950 shadow-2xs ring-1 ring-amber-400/40'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-amber-50/50'
                }`}
              >
                14 Días
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(30)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  diffDays === 30
                    ? 'border-amber-400 bg-amber-100 text-amber-950 shadow-2xs ring-1 ring-amber-400/40'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-amber-50/50'
                }`}
              >
                30 Días
              </button>
            </div>
          </div>

          {/* Date Pickers */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={startStr}
                onChange={(e) => setStartStr(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Fecha de Fin
              </label>
              <input
                type="date"
                value={endStr}
                min={startStr}
                onChange={(e) => setEndStr(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Total visible:</span>
              </span>
              <span className="font-bold text-slate-800 tabular-nums">
                {diffDays} días en la matriz
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Aplicar Rango</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
