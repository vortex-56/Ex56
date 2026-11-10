import { Project } from '../types';
import { getTodayDateString, getTomorrowDateString } from './dateUtils';

const STORAGE_KEY_PROJECTS = 'planmatrix_projects_v1';
const STORAGE_KEY_ACTIVE_ID = 'planmatrix_active_project_id_v1';

export function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading projects from storage:', err);
    return [];
  }
}

export function saveProjectsToStorage(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (err) {
    console.error('Error saving projects to storage:', err);
  }
}

export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch (err) {
    console.error('Error setting active project ID:', err);
  }
}

export function saveProject(project: Project): void {
  const projects = getStoredProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  const now = new Date().toISOString();
  const updatedProject = { ...project, updatedAt: now };

  if (index >= 0) {
    projects[index] = updatedProject;
  } else {
    projects.push(updatedProject);
  }

  saveProjectsToStorage(projects);
  setActiveProjectId(project.id);
}

export function deleteProject(projectId: string): void {
  const projects = getStoredProjects().filter((p) => p.id !== projectId);
  saveProjectsToStorage(projects);
  const currentActive = getActiveProjectId();
  if (currentActive === projectId) {
    if (projects.length > 0) {
      setActiveProjectId(projects[0].id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    }
  }
}

export function createNewProject(name: string): Project {
  const now = new Date().toISOString();
  const newProject: Project = {
    id: 'proj_' + Math.random().toString(36).substring(2, 9),
    name: name.trim() || 'Mi Proyecto',
    createdAt: now,
    updatedAt: now,
    groups: [],
    activities: [],
    resources: [],
    ideas: [],
    completionLogs: {},
  };
  saveProject(newProject);
  return newProject;
}

/**
 * Creates the sample project with activities, past completed activity, and resources
 */
export function createSampleProject(): Project {
  const now = new Date().toISOString();
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  // Date 3 days ago for demo past completed activity
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 3);
  const pastDateStr = pastDate.toISOString().slice(0, 10);

  const sample: Project = {
    id: 'proj_demo_ejemplos',
    name: 'Hábitos y Proyectos (Ejemplo)',
    createdAt: now,
    updatedAt: now,
    groups: [
      { id: 'grp_salud', code: 'SAL', name: 'Salud', color: '#10b981', type: 'activity' },
      { id: 'grp_trabajo', code: 'TRB', name: 'Trabajo', color: '#6366f1', type: 'activity' },
      { id: 'grp_alimentos', code: 'ALI', name: 'Alimentos', color: '#f59e0b', type: 'resource' },
      { id: 'grp_aseo', code: 'ASE', name: 'Aseo Personal', color: '#06b6d4', type: 'resource' },
    ],
    activities: [
      {
        id: 'act_fotos',
        code: 'FOT',
        groupId: 'grp_trabajo',
        name: 'Compartir fotos',
        color: '#f59e0b',
        startDate: tomorrow,
        hasEndDate: true,
        endDate: tomorrow,
        isCompleted: false,
        scheduleType: 'finite',
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        subActivities: [],
        notes: 'Evento puntual de un solo día',
      },
      {
        id: 'act_meditar',
        code: 'MED',
        groupId: 'grp_salud',
        name: 'Meditar',
        color: '#10b981',
        startDate: tomorrow,
        hasEndDate: false,
        endDate: null,
        isCompleted: false,
        scheduleType: 'daily',
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        subActivities: [],
        notes: '1 box por día desde mañana de forma indefinida',
      },
      {
        id: 'act_videos',
        code: 'VID',
        groupId: 'grp_trabajo',
        name: 'Hacer videos',
        color: '#3b82f6',
        startDate: today,
        hasEndDate: false,
        endDate: null,
        isCompleted: false,
        scheduleType: 'specific_days',
        activeDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado, descanso Domingo (0)
        blockSize: 3,
        subActivities: [],
        notes: 'Grupos de 3 días entre lunes y sábado, descanso domingos',
      },
      {
        id: 'act_planchas',
        code: 'PLA',
        groupId: 'grp_salud',
        name: '10 Planchas',
        color: '#ec4899',
        startDate: today,
        hasEndDate: false,
        endDate: null,
        isCompleted: false,
        scheduleType: 'daily',
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        subActivities: [
          { id: 'sub_planchas_1', code: 'P1', name: '10 Planchas - Sesión 1', order: 1 },
          { id: 'sub_planchas_2', code: 'P2', name: '10 Planchas - Sesión 2', order: 2 },
          { id: 'sub_planchas_3', code: 'P3', name: '10 Planchas - Sesión 3', order: 3 },
        ],
        notes: '3 sesiones diarias con casillas esféricas; la casilla principal se marca al completar las 3',
      },
      {
        id: 'act_informe_pasado',
        code: 'INF',
        groupId: 'grp_trabajo',
        name: 'Cierre de informe mensual',
        color: '#6366f1',
        startDate: pastDateStr,
        hasEndDate: true,
        endDate: pastDateStr,
        isCompleted: true,
        completedDate: pastDateStr,
        scheduleType: 'finite',
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        subActivities: [],
        notes: 'Actividad ya completada en el pasado; visible en Historial de actividades pasadas',
      },
    ],
    resources: [
      {
        id: 'res_desayuno',
        code: 'DES',
        groupId: 'grp_alimentos',
        name: 'Desayuno',
        hasCost: true,
        cost: 0,
        hasDurationStatus: false,
        possessionStatus: 'disponible',
        availabilityStatus: 'disponible',
        notes: 'Gasto diario o recurrente (se anota en el día que cueste)',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'res_cena',
        code: 'CEN',
        groupId: 'grp_alimentos',
        name: 'Cena',
        hasCost: true,
        cost: 0,
        hasDurationStatus: false,
        possessionStatus: 'disponible',
        availabilityStatus: 'disponible',
        notes: 'Gasto diario nocturno recurrente',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'res_rastrillos',
        code: 'RAS',
        groupId: 'grp_aseo',
        name: 'Rastrillos de afeitar',
        hasCost: true,
        cost: 0,
        hasDurationStatus: true,
        possessionStatus: 'disponible',
        availabilityStatus: 'disponible',
        notes: 'Duran 15 a 20 días. Se renueva al agotarse y se anota el costo ese día',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'res_desodorante',
        code: 'DSO',
        groupId: 'grp_aseo',
        name: 'Desodorante',
        hasCost: true,
        cost: 0,
        hasDurationStatus: true,
        possessionStatus: 'disponible',
        availabilityStatus: 'por_agotar',
        notes: 'Por agotarse; renovar pronto',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'res_ropa',
        code: 'ROP',
        groupId: 'grp_aseo',
        name: 'Ropa de color',
        hasCost: false,
        cost: 0,
        hasDurationStatus: true,
        possessionStatus: 'disponible',
        availabilityStatus: 'por_agotar',
        notes: 'Sin costo monetario; se renueva a disponible cuando se lava la ropa',
        createdAt: now,
        updatedAt: now,
      },
    ],
    completionLogs: {
      [`act_planchas_sub_planchas_1_${today}`]: true,
      [`act_planchas_sub_planchas_2_${today}`]: true,
      [`act_informe_pasado_main_${pastDateStr}`]: true,
    },
    resourceLogs: {
      [`res_desayuno_${today}`]: { cost: 6.00, bought: true },
      [`res_rastrillos_${pastDateStr}`]: { cost: 15.00, bought: true, renewed: true, state: 'conseguido' },
    },
    ideas: [
      {
        id: 'idea_info_1',
        title: 'Información',
        boxColor: '#FFFFFF',
        order: 0,
        collapsed: false,
        createdAt: now,
        updatedAt: now,
        phrases: [
          {
            id: 'phr_1',
            text: 'Resumen ejecutivo del sistema Ex56 y control de hábitos',
            fontSize: 'lg',
            color: '#1e3a8a',
            fontWeight: 'bold',
          },
          {
            id: 'phr_2',
            text: 'En Registro se calcula automáticamente el gasto, ganancias y balance del periodo visible.',
            fontSize: 'base',
            color: '#047857',
            fontWeight: 'semibold',
          },
          {
            id: 'phr_3',
            text: 'Las cajas de ideas se ajustan automáticamente a la cantidad de texto en su interior.',
            fontSize: 'sm',
            color: '#475569',
            fontWeight: 'normal',
          },
        ],
      },
      {
        id: 'idea_ideas_2',
        title: 'Estrategias y Mejoras',
        boxColor: '#FEF9C3',
        order: 1,
        collapsed: false,
        createdAt: now,
        updatedAt: now,
        phrases: [
          {
            id: 'phr_4',
            text: 'Priorizar recursos esenciales al inicio de cada mes',
            fontSize: 'base',
            color: '#b45309',
            fontWeight: 'bold',
          },
          {
            id: 'phr_5',
            text: 'Mantener un balance positivo reduciendo gastos no indispensables.',
            fontSize: 'sm',
            color: '#1e293b',
            fontWeight: 'medium',
          },
        ],
      },
    ],
  };

  saveProject(sample);
  return sample;
}
