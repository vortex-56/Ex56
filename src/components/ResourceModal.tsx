import React, { useState, useEffect } from 'react';
import { Resource, ActivityGroup, GroupType, ResourcePossession, ResourceAvailability, ResourceNature } from '../types';
import { COLOR_PALETTE } from '../utils/colors';
import { 
  X, 
  Coins, 
  Layers,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Receipt,
  ShoppingBag
} from 'lucide-react';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Resource) => void;
  initialResource?: Resource | null;
  groups: ActivityGroup[];
  onCreateGroup: (name: string, color: string, code?: string, showBox?: boolean, type?: GroupType) => ActivityGroup;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialResource,
  groups,
  onCreateGroup,
}) => {
  const [resourceNature, setResourceNature] = useState<ResourceNature>('expense');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [groupId, setGroupId] = useState('');
  const [hasCost, setHasCost] = useState(true);
  const [cost, setCost] = useState<number>(0);
  const [hasDurationStatus, setHasDurationStatus] = useState<boolean>(false);
  const [possessionStatus, setPossessionStatus] = useState<ResourcePossession>('disponible');
  const [availabilityStatus, setAvailabilityStatus] = useState<ResourceAvailability>('disponible');
  const [notes, setNotes] = useState('');

  // Inline group creation
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(COLOR_PALETTE[2].hex);

  // Strictly filter to resource groups only
  const resourceGroups = groups.filter(g => g.type === 'resource');

  useEffect(() => {
    if (initialResource && isOpen) {
      setResourceNature(initialResource.resourceNature || 'expense');
      setName(initialResource.name);
      setCode(initialResource.code || '');
      setGroupId(initialResource.groupId || '');
      setHasCost(initialResource.hasCost !== undefined ? initialResource.hasCost : true);
      setCost(initialResource.cost ?? 0);
      setHasDurationStatus(initialResource.hasDurationStatus ?? false);
      const poss = initialResource.possessionStatus === 'se_requiere' ? 'falta' : (initialResource.possessionStatus || 'disponible');
      setPossessionStatus(poss as ResourcePossession);
      const avail = initialResource.availabilityStatus === 'por_agotarse' ? 'por_agotar' : (initialResource.availabilityStatus || 'disponible');
      setAvailabilityStatus(avail as ResourceAvailability);
      setNotes(initialResource.notes || '');
    } else if (isOpen) {
      setResourceNature('expense');
      setName('');
      setCode('');
      setGroupId(resourceGroups[0]?.id || '');
      setHasCost(true);
      setCost(0);
      setHasDurationStatus(false);
      setPossessionStatus('disponible');
      setAvailabilityStatus('disponible');
      setNotes('');
    }
    setIsCreatingGroup(false);
    setNewGroupName('');
    setNewGroupCode('');
  }, [initialResource, isOpen, groups]);

  if (!isOpen) return null;

  const handleInlineGroupCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup = onCreateGroup(
      newGroupName.trim(),
      newGroupColor,
      newGroupCode.trim().toUpperCase() || undefined,
      false,
      'resource'
    );
    setGroupId(newGroup.id);
    setIsCreatingGroup(false);
    setNewGroupName('');
    setNewGroupCode('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();

    const resourceData: Resource = {
      id: initialResource ? initialResource.id : 'res_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      code: code.trim().toUpperCase() || undefined,
      groupId: groupId || null,
      resourceNature,
      order: initialResource?.order !== undefined ? initialResource.order : undefined,
      hasCost,
      cost: hasCost ? Number(cost) || 0 : 0,
      hasDurationStatus,
      possessionStatus: hasDurationStatus ? possessionStatus : 'disponible',
      availabilityStatus: hasDurationStatus ? (possessionStatus === 'falta' ? 'agotado' : availabilityStatus) : 'disponible',
      lastRenewedDate: initialResource?.lastRenewedDate || null,
      notes: notes.trim() || undefined,
      createdAt: initialResource ? initialResource.createdAt : now,
      updatedAt: now,
    };

    onSave(resourceData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {initialResource ? 'Editar Registro' : 'Nuevo Registro'}
              </h2>
              <p className="text-xs text-slate-500">
                Configura si tiene precio y si lleva control de duración (disponible, por agotar o agotado).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Nature Selector: Gasto vs Activo / Ganancia */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-600" />
                <span>Naturaleza del Registro</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {resourceNature === 'expense' ? 'Gasto (cuesta dinero)' : 'Activo / Servicio (genera ganancia)'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setResourceNature('expense')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  resourceNature === 'expense'
                    ? 'bg-amber-100/90 text-amber-950 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <div className="text-left leading-tight">
                  <div className="text-xs">Gasto / Insumo</div>
                  <div className="text-[10px] text-slate-500 font-normal">Cuesta dinero (Comprar / Falta)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setResourceNature('income')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  resourceNature === 'income'
                    ? 'bg-emerald-100/90 text-emerald-950 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <div className="text-left leading-tight">
                  <div className="text-xs">Activo / Servicio</div>
                  <div className="text-[10px] text-slate-500 font-normal">Genera ganancia (Ganado / Recompensa)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Row 1: Name and Short Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 block">
                {resourceNature === 'expense' ? 'Nombre del Gasto / Recurso *' : 'Nombre del Servicio / Activo *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={resourceNature === 'expense' ? 'Ej. Desayuno, Rastrillos de afeitar, Ropa de color...' : 'Ej. Servicio de diseño web, Mantenimiento TI, Consultoría...'}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                Cód. Corto
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={resourceNature === 'expense' ? 'Ej. DES' : 'Ej. WEB'}
                maxLength={5}
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase text-center bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 2: Group Assignment with inline creator */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-700" />
                <span>Grupo del Registro</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
              >
                {isCreatingGroup ? 'Cancelar nuevo grupo' : '+ Crear grupo'}
              </button>
            </div>

            {isCreatingGroup ? (
              <div className="pt-2 pb-1 space-y-2 border-t border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Nombre del nuevo grupo (ej. Clientes, Alimentos, Hogar)..."
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newGroupCode}
                    onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                    placeholder="Cód (ej. CLI)"
                    maxLength={4}
                    className="w-20 px-2 py-1.5 text-xs font-mono font-bold uppercase text-center bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleInlineGroupCreate}
                    disabled={!newGroupName.trim()}
                    className="px-3 py-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    Crear
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500">Color:</span>
                  {COLOR_PALETTE.slice(0, 8).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewGroupColor(c.hex)}
                      className={`w-4 h-4 rounded-full transition-transform ${newGroupColor === c.hex ? 'ring-2 ring-slate-800 scale-110' : ''}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
              >
                <option value="">Sin grupo asignado (General)</option>
                {resourceGroups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.code ? `[${g.code}] ` : ''}{g.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Row 3: Price / Gain Configuration */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Coins className={`w-4 h-4 ${resourceNature === 'income' ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <span>
                    {resourceNature === 'expense' ? '¿Tiene precio o costo monetario?' : '¿Tiene tarifa o valor monetario de ganancia?'}
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {resourceNature === 'expense'
                    ? 'Si no cuesta dinero (ej. ropa de color que se lava), desactiva esta opción.'
                    : 'Define el valor a recibir de ganancia por este servicio o activo.'}
                </p>
              </div>

              {/* Toggle Tiene Precio */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCost}
                  onChange={(e) => setHasCost(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${resourceNature === 'income' ? 'peer-checked:bg-emerald-500' : 'peer-checked:bg-amber-500'}`}></div>
              </label>
            </div>

            {hasCost ? (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs shrink-0">
                    {resourceNature === 'expense' ? 'Precio / Costo referencial:' : 'Valor de Ganancia por defecto:'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-500">S/.</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      placeholder="0.00"
                      value={cost > 0 ? cost : ''}
                      onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-center focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  {resourceNature === 'expense'
                    ? 'En el calendario puedes ajustar el monto exacto en cada día que compres.'
                    : 'En el calendario marcarás el día que genere ganancia: puedes marcarlo como Recompensa (por cobrar) o Ganado (cobrado).'}
                </p>
              </div>
            ) : (
              <div className="pt-1.5 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 italic">
                  Este registro no tiene valor monetario asignado.
                </span>
              </div>
            )}
          </div>

          {/* Row 4: Duration Status Configuration (Tiene estado de duración o no) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-700" />
                  <span>¿Tiene estado de duración?</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Para objetos que duran días o meses (rastrillos, jabón, desodorante o ropa limpia).
                </p>
              </div>

              {/* Toggle Tiene Estado de Duración */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDurationStatus}
                  onChange={(e) => setHasDurationStatus(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {hasDurationStatus ? (
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                {/* Initial possession state */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    Estado inicial de posesión:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPossessionStatus('disponible')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        possessionStatus === 'disponible'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ✓ Se tiene
                    </button>
                    <button
                      type="button"
                      onClick={() => setPossessionStatus('falta')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        possessionStatus === 'falta'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ★ Falta comprar / adquirir
                    </button>
                  </div>
                </div>

                {/* Initial availability level if possession is disponible */}
                {possessionStatus === 'disponible' && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nivel de disponibilidad:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAvailabilityStatus('disponible')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                          availabilityStatus === 'disponible'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        Disponible
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvailabilityStatus('por_agotar')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                          availabilityStatus === 'por_agotar'
                            ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        Por agotar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvailabilityStatus('agotado')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                          availabilityStatus === 'agotado'
                            ? 'bg-rose-100 text-rose-950 border-rose-400 font-bold'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        Agotado
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-1.5 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 italic">
                  Gasto recurrente o diario (como desayunos, cenas o pasajes; se anota en el día que cueste).
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">
              Notas u Observaciones (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Lugar de compra, detalles o frecuencia..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg disabled:opacity-50 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              {initialResource ? 'Guardar Cambios' : 'Crear Registro'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
