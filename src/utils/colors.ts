export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  bgLight: string;
  borderLight: string;
  text: string;
}

export const COLOR_PALETTE: ColorOption[] = [
  { id: 'indigo', name: 'Índigo', hex: '#6366f1', bgLight: '#eef2ff', borderLight: '#c7d2fe', text: '#4338ca' },
  { id: 'emerald', name: 'Esmeralda', hex: '#10b981', bgLight: '#ecfdf5', borderLight: '#a7f3d0', text: '#065f46' },
  { id: 'blue', name: 'Azul', hex: '#3b82f6', bgLight: '#eff6ff', borderLight: '#bfdbfe', text: '#1e40af' },
  { id: 'rose', name: 'Rosa', hex: '#f43f5e', bgLight: '#fff1f2', borderLight: '#fecdd3', text: '#9f1239' },
  { id: 'amber', name: 'Ámbar', hex: '#f59e0b', bgLight: '#fffbeb', borderLight: '#fde68a', text: '#92400e' },
  { id: 'purple', name: 'Púrpura', hex: '#a855f7', bgLight: '#faf5ff', borderLight: '#e9d5ff', text: '#6b21a8' },
  { id: 'cyan', name: 'Cian', hex: '#06b6d4', bgLight: '#ecfeff', borderLight: '#a5f3fc', text: '#155e75' },
  { id: 'pink', name: 'Fucsia', hex: '#ec4899', bgLight: '#fdf2f8', borderLight: '#fbcfe8', text: '#9d174d' },
  { id: 'lime', name: 'Lima', hex: '#84cc16', bgLight: '#f7fee7', borderLight: '#d9f99d', text: '#3f6212' },
  { id: 'orange', name: 'Naranja', hex: '#f97316', bgLight: '#fff7ed', borderLight: '#fed7aa', text: '#9a3412' },
  { id: 'red', name: 'Rojo Coral', hex: '#ef4444', bgLight: '#fef2f2', borderLight: '#fecaca', text: '#991b1b' },
  { id: 'teal', name: 'Turquesa', hex: '#14b8a6', bgLight: '#f0fdfa', borderLight: '#99f6e4', text: '#115e59' },
  { id: 'violet', name: 'Violeta', hex: '#8b5cf6', bgLight: '#f5f3ff', borderLight: '#ddd6fe', text: '#5b21b6' },
  { id: 'yellow', name: 'Amarillo Sol', hex: '#eab308', bgLight: '#fefce8', borderLight: '#fef08a', text: '#854d0e' },
  { id: 'sky', name: 'Celeste', hex: '#0ea5e9', bgLight: '#f0f9ff', borderLight: '#bae6fd', text: '#0369a1' },
  { id: 'slate', name: 'Pizarra', hex: '#64748b', bgLight: '#f8fafc', borderLight: '#cbd5e1', text: '#334155' },
];

export function getColorByHex(hex: string): ColorOption {
  return COLOR_PALETTE.find((c) => c.hex.toLowerCase() === hex.toLowerCase()) || COLOR_PALETTE[0];
}
