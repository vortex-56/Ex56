import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Idea, IdeaPhrase, IdeaFontSize, IdeaFontWeight } from '../types';
import { 
  Lightbulb, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight, 
  X, 
  Check, 
  Palette, 
  Type, 
  Search, 
  Eye, 
  Layers,
  ArrowRight,
  Sparkles,
  Eraser,
  Bold
} from 'lucide-react';

interface IdeasBoxProps {
  ideas: Idea[];
  onAddIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateIdea: (idea: Idea) => void;
  onDeleteIdea: (ideaId: string) => void;
  onReorderIdeas: (reorderedIdeas: Idea[]) => void;
  onToggleCollapse?: (ideaId: string) => void;
}

// Colores claros y bastante claros para las cajas de ideas
export const LIGHT_BOX_COLORS = [
  { name: 'Blanco Puro', value: '#FFFFFF', border: '#CBD5E1' },
  { name: 'Crema Cálido', value: '#FEF9C3', border: '#FDE047' },
  { name: 'Menta Fresca', value: '#DCFCE7', border: '#86EFAC' },
  { name: 'Celeste Suave', value: '#E0F2FE', border: '#7DD3FC' },
  { name: 'Lavanda Pastel', value: '#F3E8FF', border: '#D8B4FE' },
  { name: 'Rosa Pastel', value: '#FCE7F3', border: '#F9A8D4' },
  { name: 'Melocotón Claro', value: '#FFEDD5', border: '#FDBA74' },
  { name: 'Hielo Turquesa', value: '#CCFBF1', border: '#5EEAD4' },
  { name: 'Gris Nieve', value: '#F8FAFC', border: '#CBD5E1' },
  { name: 'Limón Suave', value: '#FEF08A', border: '#FACC15' },
];

export const TEXT_COLORS = [
  { name: 'Negro Slate', value: '#0F172A' },
  { name: 'Gris Carbón', value: '#475569' },
  { name: 'Azul Marino', value: '#1E3A8A' },
  { name: 'Azul Real', value: '#2563EB' },
  { name: 'Verde Bosque', value: '#047857' },
  { name: 'Verde Esmeralda', value: '#16A34A' },
  { name: 'Ámbar Intenso', value: '#B45309' },
  { name: 'Naranja Fuego', value: '#EA580C' },
  { name: 'Rojo Carmesí', value: '#DC2626' },
  { name: 'Púrpura', value: '#7E22CE' },
  { name: 'Rosa Magenta', value: '#BE185D' },
  { name: 'Cian Profundo', value: '#0E7490' },
];

export const FONT_SIZE_OPTIONS = [
  { label: 'XS (12px)', shortLabel: 'XS', px: '12px', title: 'Muy pequeña (12px)' },
  { label: 'S (14px)', shortLabel: 'S', px: '14px', title: 'Pequeña (14px)' },
  { label: 'M (16px)', shortLabel: 'M', px: '16px', title: 'Normal (16px)' },
  { label: 'L (19px)', shortLabel: 'L', px: '19px', title: 'Mediana (19px)' },
  { label: 'XL (23px)', shortLabel: 'XL', px: '23px', title: 'Grande (23px)' },
  { label: '2XL (28px)', shortLabel: '2XL', px: '28px', title: 'Muy grande (28px)' },
];

export const FONT_WEIGHT_OPTIONS = [
  { label: 'Normal (400)', shortLabel: 'Normal', weight: '400', title: 'Grosor normal (400)' },
  { label: 'Medio (500)', shortLabel: 'Medio', weight: '500', title: 'Grosor medio (500)' },
  { label: 'Seminegrita (600)', shortLabel: 'Semi', weight: '600', title: 'Grosor seminegrita (600)' },
  { label: 'Negrita (700)', shortLabel: 'Negrita', weight: '700', title: 'Grosor negrita (700)' },
  { label: 'Extra (900)', shortLabel: 'Extra', weight: '900', title: 'Grosor extra negrita (900)' },
];

// Helper to sanitize HTML content for safe rendering
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\son\w+=[^\s>]+/gi, '')
    .replace(/javascript:/gi, '');
}

// Helper to strip HTML tags for plain text preview
export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Convert phrases to HTML if contentHtml is not present
export function phrasesToHtml(phrases: IdeaPhrase[]): string {
  if (!phrases || phrases.length === 0) return '';
  const sMap: Record<string, string> = {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '19px',
    xl: '23px',
    '2xl': '28px',
  };
  const wMap: Record<string, string> = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '900',
  };

  return phrases
    .map((p) => {
      const styles: string[] = [];
      if (p.color) styles.push(`color: ${p.color};`);
      if (p.fontWeight) styles.push(`font-weight: ${wMap[p.fontWeight] || '400'};`);
      if (p.fontSize) styles.push(`font-size: ${sMap[p.fontSize] || '16px'};`);
      const styleAttr = styles.length > 0 ? ` style="${styles.join(' ')}"` : '';
      return `<div${styleAttr}>${escapeHtml(p.text || '')}</div>`;
    })
    .join('');
}

// Convert HTML to phrases for backward-compatible exports
export function htmlToPhrases(html: string): IdeaPhrase[] {
  if (!html) return [];
  const plain = stripHtml(html);
  const lines = plain.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return [{ id: 'phr_1', text: 'Nota vacía', fontSize: 'base', color: '#0F172A', fontWeight: 'normal' }];
  }
  return lines.map((line, idx) => ({
    id: `phr_${idx + 1}`,
    text: line,
    fontSize: 'base',
    color: '#0F172A',
    fontWeight: 'normal',
  }));
}

export const IdeasBox: React.FC<IdeasBoxProps> = ({
  ideas,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  onReorderIdeas,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Slide-over Drawer from the left state (igual que Misiones Diarias)
  const [drawerIdeaId, setDrawerIdeaId] = useState<string | null>(null);

  // Editor Modal State (Crear o Editar idea)
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // In-app deletion confirmation states (replaces window.confirm which is blocked in iframes)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteDrawer, setConfirmDeleteDrawer] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formBoxColor, setFormBoxColor] = useState(LIGHT_BOX_COLORS[0].value);
  const [formHtml, setFormHtml] = useState('');

  // Selected text information for floating indicator in editor
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState('');
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);

  // Reference to the contentEditable element
  const editorRef = useRef<HTMLDivElement | null>(null);
  // Reference to stored DOM Range
  const savedRangeRef = useRef<Range | null>(null);

  // Filtered and sorted ideas list
  const sortedIdeas = ideas.slice().sort((a, b) => a.order - b.order);
  const filteredIdeas = sortedIdeas.filter((idea) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (idea.title.toLowerCase().includes(q)) return true;
    if (idea.contentHtml && stripHtml(idea.contentHtml).toLowerCase().includes(q)) return true;
    return idea.phrases.some((p) => p.text.toLowerCase().includes(q));
  });

  // Current idea opened in the left slide-over drawer
  const drawerIdea = ideas.find((i) => i.id === drawerIdeaId) || null;
  const drawerIdeaIndex = drawerIdea ? sortedIdeas.findIndex((i) => i.id === drawerIdea.id) : -1;

  // Open drawer from the left
  const handleOpenDrawer = (ideaId: string) => {
    setDrawerIdeaId(ideaId);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerIdeaId(null);
    setConfirmDeleteDrawer(false);
  };

  // Navigate inside drawer (prev/next)
  const handleDrawerNavigate = (direction: 'prev' | 'next') => {
    setConfirmDeleteDrawer(false);
    if (drawerIdeaIndex === -1 || sortedIdeas.length === 0) return;
    if (direction === 'prev' && drawerIdeaIndex > 0) {
      setDrawerIdeaId(sortedIdeas[drawerIdeaIndex - 1].id);
    } else if (direction === 'next' && drawerIdeaIndex < sortedIdeas.length - 1) {
      setDrawerIdeaId(sortedIdeas[drawerIdeaIndex + 1].id);
    }
  };

  // Start creating new idea
  const handleStartCreate = () => {
    setEditingIdeaId(null);
    setFormTitle('Nueva Idea');
    setFormBoxColor(LIGHT_BOX_COLORS[0].value);
    const initialHtml = '<div>Escribe aquí la descripción de tu idea...</div><div>Selecciona cualquier palabra con el cursor y cámbiale su color, grosor o tamaño.</div>';
    setFormHtml(initialHtml);
    setHasSelection(false);
    setSelectedSnippet('');
    setSelectionNotice(null);
    setIsCreatingNew(true);
  };

  // Start editing existing idea
  const handleStartEdit = (idea: Idea) => {
    setIsCreatingNew(false);
    setEditingIdeaId(idea.id);
    setFormTitle(idea.title);
    setFormBoxColor(idea.boxColor || LIGHT_BOX_COLORS[0].value);
    
    // Use contentHtml if available, otherwise convert phrases to HTML
    const initialHtml = idea.contentHtml 
      ? idea.contentHtml 
      : phrasesToHtml(idea.phrases);
    setFormHtml(initialHtml);
    setHasSelection(false);
    setSelectedSnippet('');
    setSelectionNotice(null);
  };

  // Keep editor content synchronized when modal opens
  useEffect(() => {
    if ((isCreatingNew || editingIdeaId) && editorRef.current) {
      editorRef.current.innerHTML = formHtml;
    }
  }, [isCreatingNew, editingIdeaId]);

  // Save current selection range whenever user selects or moves cursor in the editor
  const saveCurrentSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setHasSelection(false);
      setSelectedSnippet('');
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
      setHasSelection(false);
      setSelectedSnippet('');
      return;
    }

    if (sel.isCollapsed) {
      setHasSelection(false);
      setSelectedSnippet('');
      savedRangeRef.current = range.cloneRange();
    } else {
      setHasSelection(true);
      const text = sel.toString().trim();
      setSelectedSnippet(text.length > 25 ? text.slice(0, 25) + '...' : text);
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  // Restore stored selection range before applying styles
  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  // Apply styles ONLY to the selected text
  const applyStyleToSelection = (styles: { color?: string; fontWeight?: string; fontSize?: string }) => {
    restoreSelection();
    const sel = window.getSelection();

    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelectionNotice('Por favor, selecciona primero el texto con el cursor para cambiarle el estilo.');
      setTimeout(() => setSelectionNotice(null), 3500);
      return;
    }

    const range = sel.getRangeAt(0);
    if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    // Extract the exact contents of the selection
    const extractedFragment = range.extractContents();
    const span = document.createElement('span');

    if (styles.color) span.style.color = styles.color;
    if (styles.fontWeight) span.style.fontWeight = styles.fontWeight;
    if (styles.fontSize) span.style.fontSize = styles.fontSize;

    // Place the extracted content inside the newly styled span
    span.appendChild(extractedFragment);
    range.insertNode(span);

    // Re-select the span contents so the user can continue formatting (e.g., color + bold)
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(newRange);
    savedRangeRef.current = newRange.cloneRange();

    // Update state and notify
    if (editorRef.current) {
      setFormHtml(editorRef.current.innerHTML);
    }
    setHasSelection(true);
    const text = span.textContent?.trim() || '';
    setSelectedSnippet(text.length > 25 ? text.slice(0, 25) + '...' : text);
  };

  // Clear custom formatting on selected text
  const handleClearSelectionFormat = () => {
    restoreSelection();
    const sel = window.getSelection();

    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelectionNotice('Selecciona el texto al que deseas quitarle el formato.');
      setTimeout(() => setSelectionNotice(null), 3500);
      return;
    }

    const range = sel.getRangeAt(0);
    if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const extracted = range.extractContents();
    const temp = document.createElement('div');
    temp.appendChild(extracted);

    // Strip inline styles from elements within selection
    temp.querySelectorAll('*').forEach((el) => {
      if (el instanceof HTMLElement) {
        el.removeAttribute('style');
      }
    });

    const plainText = temp.innerText || temp.textContent || '';
    const textNode = document.createTextNode(plainText);
    range.insertNode(textNode);

    const newRange = document.createRange();
    newRange.selectNode(textNode);
    sel.removeAllRanges();
    sel.addRange(newRange);
    savedRangeRef.current = newRange.cloneRange();

    if (editorRef.current) {
      setFormHtml(editorRef.current.innerHTML);
    }
  };

  // Sync content on user typing in contentEditable
  const handleEditorInput = () => {
    if (editorRef.current) {
      setFormHtml(editorRef.current.innerHTML);
    }
    saveCurrentSelection();
  };

  // Save creation or edit
  const handleSaveForm = () => {
    const titleClean = formTitle.trim() || 'Sin título';
    const rawHtml = editorRef.current ? editorRef.current.innerHTML : formHtml;
    const finalHtml = sanitizeHtml(rawHtml.trim()) || '<div>Nota sin contenido</div>';
    const finalPhrases = htmlToPhrases(finalHtml);

    if (isCreatingNew) {
      onAddIdea({
        title: titleClean,
        boxColor: formBoxColor,
        contentHtml: finalHtml,
        phrases: finalPhrases,
        order: ideas.length,
        collapsed: false,
      });
    } else if (editingIdeaId) {
      const existing = ideas.find((i) => i.id === editingIdeaId);
      if (existing) {
        onUpdateIdea({
          ...existing,
          title: titleClean,
          boxColor: formBoxColor,
          contentHtml: finalHtml,
          phrases: finalPhrases,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    setIsCreatingNew(false);
    setEditingIdeaId(null);
  };

  // Cancel editing
  const handleCancelForm = () => {
    setIsCreatingNew(false);
    setEditingIdeaId(null);
  };

  // Move idea up/down in list
  const handleMoveIdea = (ideaId: string, direction: 'up' | 'down') => {
    const list = sortedIdeas;
    const idx = list.findIndex((i) => i.id === ideaId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const copy = [...list];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);

    const reordered = copy.map((item, index) => ({
      ...item,
      order: index,
    }));
    onReorderIdeas(reordered);
  };

  return (
    <div className="space-y-4">

      {/* TOP HEADER BAR: Título de la sección, contador, buscador y botón "+ Nueva Idea" */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
            <Lightbulb className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Ideas y Notas
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {ideas.length} {ideas.length === 1 ? 'nota' : 'notas'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Haz clic en cualquier título para abrir la caja lateral desde la izquierda con tus colores y tamaños configurados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título o contenido..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* "+ Nueva Idea" button */}
          <button
            type="button"
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Idea</span>
          </button>
        </div>
      </div>

      {/* ÍNDICE RÁPIDO DE TÍTULOS CON CAJITA DE COLOR (Acceso inmediato al drawer de la izquierda) */}
      {ideas.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-bold flex items-center gap-1.5 text-slate-800">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Títulos de Ideas (Clic para abrir caja lateral):
            </span>
            <span className="text-[11px] text-slate-400">
              {ideas.length} registradas
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {sortedIdeas.map((idea) => {
              const isSelected = drawerIdeaId === idea.id;
              return (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => handleOpenDrawer(idea.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:scale-102 ${
                    isSelected
                      ? 'ring-2 ring-emerald-500 ring-offset-1 border-emerald-400 bg-emerald-50/70 text-slate-950 font-black'
                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  title={`Abrir nota "${idea.title}" en la caja de la izquierda`}
                >
                  {/* Cajita con el color de la caja de la idea */}
                  <span
                    className="w-4 h-4 rounded-xs border border-black/25 shrink-0 shadow-2xs"
                    style={{ backgroundColor: idea.boxColor || '#FFFFFF' }}
                    aria-hidden="true"
                  />
                  <span className="truncate max-w-[180px]">{idea.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* LISTA PRINCIPAL: Solo muestra títulos con cajita de color y acceso a la caja izquierda */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery ? 'No se encontraron ideas con esa búsqueda' : 'Aún no tienes ideas registradas'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? 'Prueba buscando con otra palabra o limpia el filtro de búsqueda.'
                : 'Crea tu primera caja de ideas, personaliza el color y asigna colores, grosores y tamaños solo al texto que tú selecciones.'}
            </p>
          </div>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Crear mi primera Idea</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredIdeas.map((idea, index) => {
            const isDrawerActive = drawerIdeaId === idea.id;
            const plainText = idea.contentHtml 
              ? stripHtml(idea.contentHtml) 
              : idea.phrases.map((p) => p.text).join(' ');
            const previewSnippet = plainText.length > 90 ? plainText.slice(0, 90) + '...' : plainText;

            return (
              <div
                key={idea.id}
                className={`w-full rounded-2xl border transition-all duration-150 p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs ${
                  isDrawerActive
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Zona izquierda: Cajita de color, Título y fragmento de texto */}
                <div
                  onClick={() => handleOpenDrawer(idea.id)}
                  className="flex items-start sm:items-center gap-3 min-w-0 flex-1 cursor-pointer select-none group"
                >
                  {/* Cajita del color de la imagen / nota */}
                  <span
                    className="w-6 h-6 rounded-md border border-black/20 shrink-0 shadow-2xs group-hover:scale-110 transition-transform mt-0.5 sm:mt-0"
                    style={{ backgroundColor: idea.boxColor || '#FFFFFF' }}
                    title={`Color de la caja: ${idea.boxColor || '#FFFFFF'}`}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight truncate">
                        {idea.title}
                      </h3>
                    </div>

                    {/* Línea de vista previa */}
                    {previewSnippet && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {previewSnippet}
                      </p>
                    )}
                  </div>
                </div>

                {/* Zona derecha: Botones de acción */}
                <div className="flex items-center gap-1 sm:gap-1.5 self-end sm:self-center shrink-0">
                  {/* Botón Abrir Caja Lateral */}
                  <button
                    type="button"
                    onClick={() => handleOpenDrawer(idea.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer active:scale-95"
                    title="Desplegar caja desde la izquierda"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Ver nota</span>
                  </button>

                  {/* Reordenar: Subir */}
                  <button
                    type="button"
                    onClick={() => handleMoveIdea(idea.id, 'up')}
                    disabled={index === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-20 cursor-pointer transition-colors"
                    title="Subir de posición"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  {/* Reordenar: Bajar */}
                  <button
                    type="button"
                    onClick={() => handleMoveIdea(idea.id, 'down')}
                    disabled={index === filteredIdeas.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-20 cursor-pointer transition-colors"
                    title="Bajar de posición"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Editar */}
                  <button
                    type="button"
                    onClick={() => handleStartEdit(idea)}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Editar título, color o texto de esta caja"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Eliminar (con confirmación in-app que funciona en iframes) */}
                  {confirmDeleteId === idea.id ? (
                    <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-300 animate-in fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteIdea(idea.id);
                          if (drawerIdeaId === idea.id) {
                            setDrawerIdeaId(null);
                          }
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-0.5 text-xs font-bold text-rose-700 hover:bg-rose-100 rounded cursor-pointer transition-colors"
                      >
                        ¿Borrar?
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1 py-0.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                        title="Cancelar"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(idea.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar esta idea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAJA DESDE LA IZQUIERDA (Slide-Over Drawer como hace Misiones Diarias)     */}
      {/* ========================================================================= */}
      {drawerIdea && (
        <div className="fixed inset-0 z-50 flex font-sans overflow-hidden">
          {/* Backdrop con click-outside para cerrar */}
          <div
            className="fixed inset-0 bg-slate-900/30 transition-opacity animate-in fade-in duration-200"
            onClick={handleCloseDrawer}
            aria-hidden="true"
          />

          {/* Drawer pegado a la izquierda (exactamente como Misiones Diarias) */}
          <div className="relative z-10 w-full max-w-md sm:max-w-lg lg:max-w-xl bg-white h-full shadow-2xl border-r border-slate-200 flex flex-col animate-in slide-in-from-left duration-250 ease-out">
            
            {/* Header del cajón lateral */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Cajita con el color de la caja de la idea */}
                <div
                  className="w-8 h-8 rounded-lg border border-black/20 flex items-center justify-center text-slate-950 shadow-xs shrink-0"
                  style={{ backgroundColor: drawerIdea.boxColor || '#FFFFFF' }}
                >
                  <Lightbulb className="w-4.5 h-4.5 text-slate-800" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                    {drawerIdea.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Nota guardada con estilos personalizados
                  </p>
                </div>
              </div>

              {/* Acciones de la barra superior del cajón */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Botón Editar Idea */}
                <button
                  type="button"
                  onClick={() => handleStartEdit(drawerIdea)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
                  title="Editar esta idea"
                >
                  <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Editar</span>
                </button>

                {/* Botón Eliminar (con confirmación in-app) */}
                {confirmDeleteDrawer ? (
                  <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-300 animate-in fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteIdea(drawerIdea.id);
                        setConfirmDeleteDrawer(false);
                        handleCloseDrawer();
                      }}
                      className="px-2 py-0.5 text-xs font-bold text-rose-700 hover:bg-rose-100 rounded cursor-pointer transition-colors whitespace-nowrap"
                    >
                      ¿Borrar idea?
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteDrawer(false)}
                      className="px-1 py-0.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                      title="Cancelar"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteDrawer(true)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                    title="Eliminar esta idea"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Botón Cerrar (X) */}
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Cerrar cajón lateral"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Contenido del cajón lateral: Muestra el título y TODO el texto en las líneas y colores que se creó */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
              
              {/* LA CAJA DE LA IDEA: Con el color escogido, ancho completo y altura dinámica */}
              <div
                className="w-full rounded-2xl border shadow-sm p-5 sm:p-6 space-y-4 transition-all duration-200"
                style={{
                  backgroundColor: drawerIdea.boxColor || '#FFFFFF',
                  borderColor: '#CBD5E1',
                }}
              >
                {/* Título y cajita dentro de la nota */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-black/10">
                  <span
                    className="w-4 h-4 rounded-xs border border-black/25 shrink-0 shadow-2xs"
                    style={{ backgroundColor: drawerIdea.boxColor || '#FFFFFF' }}
                  />
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    {drawerIdea.title}
                  </h3>
                </div>

                {/* TEXTO ENRIQUECIDO EN SUS LÍNEAS EXACTAS (con distintos colores y tamaños según se configuró) */}
                <div className="w-full text-slate-900 leading-relaxed break-words whitespace-pre-wrap font-sans text-base">
                  {drawerIdea.contentHtml ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(drawerIdea.contentHtml) }}
                    />
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {drawerIdea.phrases.map((phrase, idx) => (
                        <div
                          key={phrase.id || idx}
                          style={{
                            color: phrase.color || '#0F172A',
                          }}
                        >
                          {phrase.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botón para editar directamente desde la caja */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleStartEdit(drawerIdea)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar Texto, Colores y Tamaños</span>
                </button>
              </div>

            </div>

            {/* Footer del cajón lateral: Navegación entre ideas y botón cerrar */}
            <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDrawerNavigate('prev')}
                  disabled={drawerIdeaIndex <= 0}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDrawerNavigate('next')}
                  disabled={drawerIdeaIndex >= sortedIdeas.length - 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleCloseDrawer}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDICIÓN / CREACIÓN CON FORMATEO DE TEXTO SELECCIONADO            */}
      {/* ========================================================================= */}
      {(isCreatingNew || editingIdeaId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs font-sans overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg border border-black/20 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: formBoxColor }}
                >
                  <Edit3 className="w-4 h-4 text-slate-800" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {isCreatingNew ? 'Crear Nueva Caja de Idea' : 'Editar Caja de Idea'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Selecciona cualquier texto con el cursor para cambiar solo ese texto de color, grosor o tamaño.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelForm}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              
              {/* Título de la Idea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Título de la Idea / Nota:</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej. Información del Proyecto, Lista de Precios, Recordatorios..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Selector de Color Claro para la Caja */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-emerald-600" />
                    Color de la Caja (Colores claros):
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {formBoxColor}
                  </span>
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {LIGHT_BOX_COLORS.map((color) => {
                    const isSelected = formBoxColor.toLowerCase() === color.value.toLowerCase();
                    return (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormBoxColor(color.value)}
                        className={`h-9 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-emerald-600 ring-offset-2 scale-105 border-slate-400 font-bold shadow-xs'
                            : 'border-slate-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {isSelected && <Check className="w-4 h-4 text-slate-900 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EDITOR DE TEXTO ENRIQUECIDO CON FORMATEO DE SELECCIÓN */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Descripción y Contenido de la Idea:</span>
                  </label>
                </div>

                {/* BARRA DE HERRAMIENTAS DE FORMATO (onMouseDown preventDefault evita perder la selección) */}
                <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-300 space-y-2 select-none shadow-2xs">
                  
                  {/* Fila 1: Selector de Color para el texto seleccionado */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-emerald-700" />
                      Color para el texto seleccionado:
                    </span>
                    
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {TEXT_COLORS.map((tc) => (
                        <button
                          key={tc.value}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyStyleToSelection({ color: tc.value });
                          }}
                          className="w-5 h-5 rounded-full border border-black/25 transition-all hover:scale-125 cursor-pointer shadow-2xs"
                          style={{ backgroundColor: tc.value }}
                          title={`Aplicar color ${tc.name} al texto seleccionado`}
                        />
                      ))}
                      {/* Color picker libre */}
                      <div className="relative inline-flex items-center" title="Elegir cualquier otro color para el texto seleccionado">
                        <input
                          type="color"
                          defaultValue="#0F172A"
                          onChange={(e) => {
                            applyStyleToSelection({ color: e.target.value });
                          }}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fila 2: Grosor y Tamaño para el texto seleccionado */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/90 flex-wrap">
                    
                    {/* Grosor */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-700 mr-1 flex items-center gap-1">
                        <Bold className="w-3 h-3 text-slate-600" />
                        Grosor:
                      </span>
                      {FONT_WEIGHT_OPTIONS.map((fw) => (
                        <button
                          key={fw.weight}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyStyleToSelection({ fontWeight: fw.weight });
                          }}
                          className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title={fw.title}
                        >
                          {fw.shortLabel}
                        </button>
                      ))}
                    </div>

                    {/* Tamaño */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-700 mr-1">
                        Tamaño:
                      </span>
                      {FONT_SIZE_OPTIONS.map((fs) => (
                        <button
                          key={fs.px}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyStyleToSelection({ fontSize: fs.px });
                          }}
                          className="px-1.5 py-0.5 text-[11px] font-bold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title={fs.title}
                        >
                          {fs.shortLabel}
                        </button>
                      ))}

                      {/* Botón Quitar Formato */}
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleClearSelectionFormat();
                        }}
                        className="ml-1 p-1 text-slate-500 hover:text-rose-600 hover:bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Quitar formato del texto seleccionado (restablecer a normal)"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Estado / Guía de selección */}
                  <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    {hasSelection ? (
                      <span className="text-emerald-800 font-bold flex items-center gap-1 animate-in fade-in">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Texto seleccionado: "{selectedSnippet}" — Haz clic arriba para cambiar solo este texto</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        💡 <strong>Cómo funciona:</strong> Selecciona con el mouse o dedo cualquier palabra o frase y haz clic en un color, grosor o tamaño.
                      </span>
                    )}

                    {selectionNotice && (
                      <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 animate-in fade-in">
                        {selectionNotice}
                      </span>
                    )}
                  </div>

                </div>

                {/* ÁREA EDITABLE CONTENTEDITABLE */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onMouseUp={saveCurrentSelection}
                  onKeyUp={saveCurrentSelection}
                  onSelect={saveCurrentSelection}
                  className="w-full min-h-[160px] max-h-[300px] overflow-y-auto p-4 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 leading-relaxed font-sans text-base whitespace-pre-wrap transition-colors shadow-inner"
                  style={{ backgroundColor: formBoxColor }}
                />
              </div>

              {/* VISTA PREVIA EN VIVO DE LA NOTA (Se ve exactamente con los colores y tamaños configurados) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    Vista previa de la nota guardada:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Así se mostrará en la caja de la izquierda y en tu nota
                  </span>
                </div>

                <div
                  className="w-full p-4 sm:p-5 rounded-2xl border shadow-2xs space-y-3 transition-colors"
                  style={{ backgroundColor: formBoxColor, borderColor: '#CBD5E1' }}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-black/10">
                    <span
                      className="w-3.5 h-3.5 rounded-xs border border-black/20"
                      style={{ backgroundColor: formBoxColor }}
                    />
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {formTitle || 'Título de la idea'}
                    </h3>
                  </div>

                  {/* Contenido formateado en vivo */}
                  <div
                    className="w-full text-slate-900 leading-relaxed break-words whitespace-pre-wrap font-sans text-base"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(formHtml) }}
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isCreatingNew ? 'Guardar Idea' : 'Actualizar Idea'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
