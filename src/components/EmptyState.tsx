import React from 'react';
import { Plus, Sparkles, Calendar, CheckSquare } from 'lucide-react';

interface EmptyStateProps {
  onAddActivity: () => void;
  onLoadSample: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddActivity, onLoadSample }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 mb-4 shadow-xs">
        <Calendar className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-slate-900 tracking-tight">
        Tu proyecto está listo y comenzará vacío
      </h3>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
        Agrega tus hábitos y actividades con sus colores, fechas de inicio y fin (o indefinidas), patrones diarios o semanales, y sesiones divididas con casillas esféricas.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-6 w-full sm:w-auto">
        <button
          onClick={onAddActivity}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Agregar Primera Actividad</span>
        </button>

        <button
          onClick={onLoadSample}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-amber-50/70 hover:border-amber-200 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Cargar Ejemplo Demostrativo</span>
        </button>
      </div>

      {/* Feature hints */}
      <div className="grid grid-cols-2 gap-3 mt-10 pt-6 border-t border-slate-200/80 w-full text-left">
        <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
            <span>Casillas Cuadradas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Para actividades principales y hábitos estándar.
          </p>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-pink-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            </div>
            <span>Casillas Esféricas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Para sub-actividades y sesiones (ej. 10 planchas en 3 sesiones).
          </p>
        </div>
      </div>
    </div>
  );
};
