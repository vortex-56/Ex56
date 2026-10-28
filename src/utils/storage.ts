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
    completionLogs: {},
  };
  saveProject(newProject);
  return newProject;
}

/**
 * Creates the sample project with the exact examples described by the user in the prompt:
 * 1. "Mañana compartir fotos": finite event from tomorrow to tomorrow.
 * 2. "Meditar": 1 box per day from tomorrow indefinitely.
 * 3. "Hacer videos": takes 3 days, indefinite, Monday to Saturday (nothing on Sunday), 2 groups of 3 boxes.
 * 4. "10 Planchas": 3 sessions, each session generates spherical round checkboxes, parent box completes when all 3 are marked.
 */
export function createSampleProject(): Project {
  const now = new Date().toISOString();
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  const sample: Project = {
    id: 'proj_demo_ejemplos',
    name: 'Hábitos y Proyectos (Ejemplo)',
    createdAt: now,
    updatedAt: now,
    groups: [
      { id: 'grp_salud', code: 'SAL', name: 'Salud', color: '#10b981' },
      { id: 'grp_trabajo', code: 'TRB', name: 'Trabajo', color: '#6366f1' },
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
    ],
    completionLogs: {
      // Mark 2 of the 3 pushup sessions done for today as an interactive preview
      [`act_planchas_sub_planchas_1_${today}`]: true,
      [`act_planchas_sub_planchas_2_${today}`]: true,
    },
  };

  saveProject(sample);
  return sample;
}
