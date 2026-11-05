import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Project, Activity, ActivityGroup, DayInfo, SubActivity, Resource, GroupType, ResourceAvailability, DayResourceState, ResourcePossession } from './types';
import { 
  getStoredProjects, 
  saveProject, 
  saveProjectsToStorage,
  deleteProject as deleteStoredProject, 
  getActiveProjectId, 
  setActiveProjectId, 
  createNewProject, 
  createSampleProject 
} from './utils/storage';
import { 
  getDaysBetweenDates, 
  getTodayDateString, 
  formatFriendlyDate,
  getClusterDatesForDate,
  getActiveSlotDates,
  isActivityActiveOnDate
} from './utils/dateUtils';
import { TopBar } from './components/TopBar';
import { MatrixGrid } from './components/MatrixGrid';
import { ProjectModal } from './components/ProjectModal';
import { ActivityModal } from './components/ActivityModal';
import { GroupModal } from './components/GroupModal';
import { MultiSelectBar } from './components/MultiSelectBar';
import { ImportExportModal } from './components/ImportExportModal';
import { TimeSettingsModal } from './components/TimeSettingsModal';
import { EmptyState } from './components/EmptyState';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { HistoryActivitiesBox } from './components/HistoryActivitiesBox';
import { ResourcesBox } from './components/ResourcesBox';
import { ResourceModal } from './components/ResourceModal';
import { RegistroMatrixGrid } from './components/RegistroMatrixGrid';
import { 
  CheckCircle2, 
  Flame,
  LayoutGrid,
  ClipboardList
} from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Active Main Tab: 'guia' (Matriz de Actividades) | 'registro' (Recursos e Historial)
  const [activeTab, setActiveTab] = useState<'guia' | 'registro'>('guia');

  // Undo and Redo history stacks (stores previous and future project state snapshots)
  const [undoStack, setUndoStack] = useState<Project[]>([]);
  const [redoStack, setRedoStack] = useState<Project[]>([]);

  // Date range state (start date and end date)
  const [windowStartDate, setWindowStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2); // 2 days before today for initial context
    return d;
  });

  const [windowEndDate, setWindowEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 11); // 14 days total by default
    return d;
  });

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState<boolean>(false);
  const [isTimeSettingsOpen, setIsTimeSettingsOpen] = useState<boolean>(false);
  const [isDailyMissionsOpen, setIsDailyMissionsOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editingGroup, setEditingGroup] = useState<ActivityGroup | null>(null);

  // Filters & selection
  const [activeFilterGroup, setActiveFilterGroup] = useState<string | null>(null);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const stored = getStoredProjects();
    if (stored.length > 0) {
      setProjects(stored);
      const activeId = getActiveProjectId();
      const found = stored.find(p => p.id === activeId) || stored[0];
      setCurrentProject(found);
      setActiveProjectId(found.id);
    } else {
      // First time entrance: load sample project with real interactive examples
      const sample = createSampleProject();
      setProjects([sample]);
      setCurrentProject(sample);
      setActiveProjectId(sample.id);
    }
  }, []);

  // Compute days array
  const days: DayInfo[] = useMemo(() => {
    return getDaysBetweenDates(windowStartDate, windowEndDate);
  }, [windowStartDate, windowEndDate]);

  // Helper to push a snapshot to the undo history stack before making changes
  const pushUndoSnapshot = useCallback(() => {
    if (!currentProject) return;
    setUndoStack(prev => [...prev.slice(-25), JSON.parse(JSON.stringify(currentProject))]);
    setRedoStack([]); // Clear redo stack on manual new action
  }, [currentProject]);

  // Undo (Retroceder acción)
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !currentProject) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, prev.length - 1));
    setRedoStack(prev => [...prev.slice(-25), JSON.parse(JSON.stringify(currentProject))]);
    setCurrentProject(previous);
    saveProject(previous);
    setHasUnsavedChanges(true);
    setSaveToast('Acción deshecha con éxito');
    setTimeout(() => setSaveToast(null), 2000);
  }, [undoStack, currentProject]);

  // Redo (Avanzar acción)
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !currentProject) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    setUndoStack(prev => [...prev.slice(-25), JSON.parse(JSON.stringify(currentProject))]);
    setCurrentProject(next);
    saveProject(next);
    setHasUnsavedChanges(true);
    setSaveToast('Acción reanudada con éxito');
    setTimeout(() => setSaveToast(null), 2000);
  }, [redoStack, currentProject]);

  // Keyboard shortcut Ctrl+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey)
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Save current project explicitly
  const handleSaveProject = useCallback(() => {
    if (!currentProject) return;
    saveProject(currentProject);
    const updatedList = getStoredProjects();
    setProjects(updatedList);
    setHasUnsavedChanges(false);
    setSaveToast('¡Proyecto y progreso guardados con éxito!');
    setTimeout(() => setSaveToast(null), 2500);
  }, [currentProject]);

  // Project Management Handlers
  const handleSelectProject = (projectId: string) => {
    if (hasUnsavedChanges && currentProject) {
      saveProject(currentProject);
    }
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setCurrentProject(found);
      setActiveProjectId(found.id);
      setHasUnsavedChanges(false);
      setSelectedActivityIds([]);
      setSelectedGroupIds([]);
      setUndoStack([]); // Clear undo stack on project switch
      setRedoStack([]); // Clear redo stack on project switch
    }
  };

  const handleCreateProject = (name: string) => {
    const newProj = createNewProject(name);
    const updated = getStoredProjects();
    setProjects(updated);
    setCurrentProject(newProj);
    setActiveProjectId(newProj.id);
    setHasUnsavedChanges(false);
    setSelectedActivityIds([]);
    setSelectedGroupIds([]);
    setUndoStack([]);
    setRedoStack([]);
    setIsProjectModalOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteStoredProject(projectId);
    const updated = getStoredProjects();
    setProjects(updated);
    if (currentProject?.id === projectId) {
      const next = updated[0] || null;
      setCurrentProject(next);
      if (!next) {
        setIsProjectModalOpen(true);
      }
    }
  };

  const handleRenameProject = (newName: string, projectId?: string) => {
    const targetId = projectId || currentProject?.id;
    if (!targetId || !newName.trim()) return;

    const stored = getStoredProjects();
    const updatedList = stored.map(p => {
      if (p.id === targetId) {
        return {
          ...p,
          name: newName.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProjects(updatedList);
    saveProjectsToStorage(updatedList);

    if (currentProject && currentProject.id === targetId) {
      const updatedCurr = {
        ...currentProject,
        name: newName.trim(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentProject(updatedCurr);
      saveProject(updatedCurr);
    }

    setSaveToast(`Proyecto renombrado a "${newName.trim()}"`);
    setTimeout(() => setSaveToast(null), 2000);
  };

  const handleLoadSampleProject = () => {
    const sample = createSampleProject();
    const updated = getStoredProjects();
    setProjects(updated);
    setCurrentProject(sample);
    setActiveProjectId(sample.id);
    setHasUnsavedChanges(false);
    setSelectedActivityIds([]);
    setSelectedGroupIds([]);
    setUndoStack([]);
    setRedoStack([]);
    setIsProjectModalOpen(false);
  };

  // Activity Matrix Toggle Handlers with day_clusters support
  const handleToggleCell = (activityId: string, subActivityId: string | null, dateStr: string) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const activity = currentProject.activities.find(a => a.id === activityId);
    const targetDates = activity?.scheduleType === 'day_clusters' && activity.clusterSize
      ? getClusterDatesForDate(activity, dateStr)
      : [dateStr];

    const subKey = subActivityId || 'main';
    const nextLogs = { ...currentProject.completionLogs };
    const isCurrentlyChecked = !!nextLogs[`${activityId}_${subKey}_${dateStr}`];

    targetDates.forEach(dStr => {
      const key = `${activityId}_${subKey}_${dStr}`;
      if (isCurrentlyChecked) {
        delete nextLogs[key];
      } else {
        nextLogs[key] = true;
      }
    });

    const updatedProject: Project = {
      ...currentProject,
      completionLogs: nextLogs,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleToggleParentDay = (activity: Activity, dateStr: string) => {
    if (!currentProject || activity.subActivities.length === 0) return;
    pushUndoSnapshot();

    const targetDates = activity.scheduleType === 'day_clusters' && activity.clusterSize
      ? getClusterDatesForDate(activity, dateStr)
      : [dateStr];

    const nextLogs = { ...currentProject.completionLogs };
    const allChecked = activity.subActivities.every(
      sub => !!nextLogs[`${activity.id}_${sub.id}_${dateStr}`]
    );

    targetDates.forEach(dStr => {
      for (const sub of activity.subActivities) {
        const key = `${activity.id}_${sub.id}_${dStr}`;
        if (allChecked) {
          delete nextLogs[key];
        } else {
          nextLogs[key] = true;
        }
      }
    });

    const updatedProject: Project = {
      ...currentProject,
      completionLogs: nextLogs,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleToggleGroupDay = (group: ActivityGroup, dateStr: string) => {
    if (!currentProject) return;
    pushUndoSnapshot();
    const logKey = `group_${group.id}_main_${dateStr}`;
    const nextLogs = { ...currentProject.completionLogs };
    if (nextLogs[logKey]) {
      delete nextLogs[logKey];
    } else {
      nextLogs[logKey] = true;
    }
    const updatedProject: Project = {
      ...currentProject,
      completionLogs: nextLogs,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  // Add / Edit Activity
  const handleSaveActivity = (activityData: Activity) => {
    let proj = currentProject;
    if (!proj) {
      proj = createNewProject('Mi Proyecto');
      setCurrentProject(proj);
      setProjects([proj]);
    }
    pushUndoSnapshot();

    const currentActs = [...proj.activities];
    const index = currentActs.findIndex(a => a.id === activityData.id);

    if (index >= 0) {
      currentActs[index] = activityData;
    } else {
      currentActs.push(activityData);
    }

    const updatedProject: Project = {
      ...proj,
      activities: currentActs,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleDeleteActivity = (activityId: string) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const currentActs = currentProject.activities.filter(a => a.id !== activityId);
    const nextLogs: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(currentProject.completionLogs)) {
      if (!key.startsWith(`${activityId}_`)) {
        nextLogs[key] = val;
      }
    }

    const updatedProject: Project = {
      ...currentProject,
      activities: currentActs,
      completionLogs: nextLogs,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProject);
    setSelectedActivityIds(prev => prev.filter(id => id !== activityId));
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleAddSubActivityQuick = (activity: Activity) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const nextOrder = (activity.subActivities?.length || 0) + 1;
    const newSub: SubActivity = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      name: `${activity.name} - Sesión ${nextOrder}`,
      order: nextOrder,
    };

    const updatedSubActivities = [...(activity.subActivities || []), newSub];
    const updatedActivity = { ...activity, subActivities: updatedSubActivities };

    handleSaveActivity(updatedActivity);
  };

  const handleToggleActivityCompletion = (activityId: string, isCompleted: boolean) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const todayString = getTodayDateString();

    const updatedActivities = currentProject.activities.map(a =>
      a.id === activityId 
        ? { 
            ...a, 
            isCompleted,
            completedDate: isCompleted ? (a.completedDate || todayString) : null,
          } 
        : a
    );

    const updatedProject: Project = {
      ...currentProject,
      activities: updatedActivities,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  // Analyzer Completion Handlers:
  // Completes the active slot (single day if daily, or active cluster of 2 or 3 days if day_clusters)
  // while keeping the activity status in progress (isCompleted: false / "en curso")
  const handleCompleteActiveSlot = (activityId: string, markDone: boolean) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const activity = currentProject.activities.find(a => a.id === activityId);
    if (!activity) return;

    const targetDates = getActiveSlotDates(activity);
    const nextLogs = { ...currentProject.completionLogs };

    targetDates.forEach(dStr => {
      if (activity.subActivities.length > 0) {
        activity.subActivities.forEach(sub => {
          const key = `${activity.id}_${sub.id}_${dStr}`;
          if (markDone) {
            nextLogs[key] = true;
          } else {
            delete nextLogs[key];
          }
        });
      } else {
        const key = `${activity.id}_main_${dStr}`;
        if (markDone) {
          nextLogs[key] = true;
        } else {
          delete nextLogs[key];
        }
      }
    });

    const updatedProject: Project = {
      ...currentProject,
      completionLogs: nextLogs,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleToggleSubInActiveSlot = (activityId: string, subId: string, markDone: boolean) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const activity = currentProject.activities.find(a => a.id === activityId);
    if (!activity) return;

    const targetDates = getActiveSlotDates(activity);
    const nextLogs = { ...currentProject.completionLogs };

    targetDates.forEach(dStr => {
      const key = `${activity.id}_${subId}_${dStr}`;
      if (markDone) {
        nextLogs[key] = true;
      } else {
        delete nextLogs[key];
      }
    });

    const updatedProject: Project = {
      ...currentProject,
      completionLogs: nextLogs,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  // Groups Management
  const handleCreateGroup = (name: string, color: string, code?: string, showBox?: boolean, type?: GroupType): ActivityGroup => {
    if (!currentProject) throw new Error('No active project');
    pushUndoSnapshot();

    const newGroup: ActivityGroup = {
      id: 'grp_' + Math.random().toString(36).substring(2, 9),
      name,
      color,
      code: code?.trim().toUpperCase() || undefined,
      showBox: showBox ?? false,
      type: type || 'activity',
    };
    const updatedGroups = [...currentProject.groups, newGroup];
    const updatedProject = {
      ...currentProject,
      groups: updatedGroups,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
    return newGroup;
  };

  const handleUpdateGroup = (updatedGroup: ActivityGroup) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const nextGroups = currentProject.groups.map(g =>
      g.id === updatedGroup.id ? updatedGroup : g
    );
    const updatedProject = {
      ...currentProject,
      groups: nextGroups,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleReorderGroups = (reorderedGroups: ActivityGroup[]) => {
    if (!currentProject) return;
    pushUndoSnapshot();
    const updatedProject = {
      ...currentProject,
      groups: reorderedGroups,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const nextGroups = currentProject.groups.filter(g => g.id !== groupId);
    const nextActivities = currentProject.activities.map(a =>
      a.groupId === groupId ? { ...a, groupId: null } : a
    );
    const updatedProject = {
      ...currentProject,
      groups: nextGroups,
      activities: nextActivities,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    if (activeFilterGroup === groupId) setActiveFilterGroup(null);
    setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  // Resources Management
  const handleSaveResource = (resData: Resource) => {
    if (!currentProject) return;
    pushUndoSnapshot();
    const currentRes = [...(currentProject.resources || [])];
    const index = currentRes.findIndex(r => r.id === resData.id);
    if (index >= 0) {
      currentRes[index] = resData;
    } else {
      currentRes.unshift(resData);
    }
    const updatedProject = {
      ...currentProject,
      resources: currentRes,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
    setSaveToast('Recurso guardado con éxito');
    setTimeout(() => setSaveToast(null), 2000);
  };

  const handleDeleteResource = (resourceId: string) => {
    if (!currentProject) return;
    pushUndoSnapshot();
    const currentRes = (currentProject.resources || []).filter(r => r.id !== resourceId);
    const nextResourceLogs = { ...(currentProject.resourceLogs || {}) };
    for (const k of Object.keys(nextResourceLogs)) {
      if (k.startsWith(`${resourceId}_`)) {
        delete nextResourceLogs[k];
      }
    }
    const updatedProject = {
      ...currentProject,
      resources: currentRes,
      resourceLogs: nextResourceLogs,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleUpdateResource = (updatedResource: Resource) => {
    if (!currentProject) return;
    pushUndoSnapshot();
    const currentRes = (currentProject.resources || []).map(r =>
      r.id === updatedResource.id ? updatedResource : r
    );
    const updatedProject = {
      ...currentProject,
      resources: currentRes,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleMoveResource = (resourceId: string, direction: 'up' | 'down') => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const list = [...(currentProject.resources || [])].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 9999;
      const orderB = b.order !== undefined ? b.order : 9999;
      return orderA - orderB;
    });

    const index = list.findIndex(r => r.id === resourceId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    } else {
      return;
    }

    const updatedRes = list.map((r, idx) => ({
      ...r,
      order: idx,
      updatedAt: new Date().toISOString(),
    }));

    const updatedProject = {
      ...currentProject,
      resources: updatedRes,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
    setSaveToast('Posición actualizada');
    setTimeout(() => setSaveToast(null), 1200);
  };

  // Resource Daily Cost & Bought Handlers for Registro Matrix
  const handleToggleResourceBought = (resourceId: string, dateStr: string) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const key = `${resourceId}_${dateStr}`;
    const nextResourceLogs = { ...(currentProject.resourceLogs || {}) };
    const currentLog = nextResourceLogs[key];
    const targetResource = currentProject.resources?.find(r => r.id === resourceId);
    const defaultCost = targetResource?.hasCost ? targetResource.cost : 0;

    if (currentLog) {
      nextResourceLogs[key] = {
        ...currentLog,
        bought: !currentLog.bought,
      };
    } else {
      nextResourceLogs[key] = {
        cost: defaultCost,
        bought: true,
      };
    }

    const updatedProject: Project = {
      ...currentProject,
      resourceLogs: nextResourceLogs,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);

    const isNowBought = nextResourceLogs[key].bought;
    if (targetResource?.resourceNature === 'income') {
      setSaveToast(isNowBought ? '¡Ganancia cobrada (Ganado)!' : 'Marcado como Recompensa por cobrar');
    } else {
      setSaveToast(isNowBought ? '¡Marcado como Comprado!' : 'Marcado como Falta comprar');
    }
    setTimeout(() => setSaveToast(null), 1800);
  };

  const handleUpdateResourceDayCost = (resourceId: string, dateStr: string, cost: number) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const key = `${resourceId}_${dateStr}`;
    const nextResourceLogs = { ...(currentProject.resourceLogs || {}) };
    const currentLog = nextResourceLogs[key];

    nextResourceLogs[key] = {
      bought: currentLog?.bought ?? false,
      cost: cost,
    };

    const updatedProject: Project = {
      ...currentProject,
      resourceLogs: nextResourceLogs,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleUpdateResourceStatus = (resourceId: string, newAvailability: ResourceAvailability) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const currentRes = (currentProject.resources || []).map(r => {
      if (r.id === resourceId) {
        return {
          ...r,
          availabilityStatus: newAvailability,
          possessionStatus: newAvailability === 'agotado' ? ('falta' as const) : ('disponible' as const),
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    const updatedProject = {
      ...currentProject,
      resources: currentRes,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleRenewResource = (resourceId: string, dateStr: string, renewalCost?: number) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const targetResource = currentProject.resources?.find(r => r.id === resourceId);
    const key = `${resourceId}_${dateStr}`;
    const nextResourceLogs = { ...(currentProject.resourceLogs || {}) };
    const costToUse = renewalCost !== undefined ? renewalCost : (targetResource?.hasCost ? (nextResourceLogs[key]?.cost || targetResource.cost || 0) : 0);

    nextResourceLogs[key] = {
      cost: costToUse,
      bought: true,
      renewed: true,
      state: 'conseguido',
    };

    const currentRes = (currentProject.resources || []).map(r => {
      if (r.id === resourceId) {
        return {
          ...r,
          availabilityStatus: 'disponible' as const,
          possessionStatus: 'disponible' as const,
          lastRenewedDate: dateStr,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    const updatedProject = {
      ...currentProject,
      resources: currentRes,
      resourceLogs: nextResourceLogs,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
    setSaveToast(costToUse > 0 ? `¡Conseguido con S/. ${costToUse.toFixed(2)}!` : '¡Recurso conseguido!');
    setTimeout(() => setSaveToast(null), 2000);
  };

  const handleSetDayResourceState = (resourceId: string, dateStr: string, state: DayResourceState, cost?: number) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const key = `${resourceId}_${dateStr}`;
    const nextResourceLogs = { ...(currentProject.resourceLogs || {}) };
    const existingLog = nextResourceLogs[key];
    const isConseguido = state === 'conseguido' || state === 'renovado';
    const isNinguno = state === 'ninguno' || state === 'agotado';
    const targetResource = currentProject.resources?.find(r => r.id === resourceId);

    const costVal = isConseguido
      ? (cost !== undefined ? cost : (targetResource?.hasCost ? (existingLog?.cost && existingLog.cost > 0 ? existingLog.cost : targetResource.cost) : 0))
      : 0;

    if (isNinguno) {
      nextResourceLogs[key] = {
        cost: 0,
        bought: false,
        renewed: false,
        state: 'ninguno',
      };
    } else {
      nextResourceLogs[key] = {
        cost: costVal,
        bought: isConseguido,
        renewed: isConseguido,
        state: state,
      };
    }

    const currentRes = (currentProject.resources || []).map(r => {
      if (r.id === resourceId) {
        let nextAvail: ResourceAvailability = 'disponible';
        let nextPossession: ResourcePossession = 'disponible';
        if (state === 'por_terminar' || state === 'por_agotar') {
          nextAvail = 'por_agotar';
        } else if (state === 'ninguno' || state === 'agotado') {
          nextAvail = 'agotado';
          nextPossession = 'falta';
        }

        return {
          ...r,
          availabilityStatus: nextAvail,
          possessionStatus: nextPossession,
          lastRenewedDate: isConseguido ? dateStr : r.lastRenewedDate,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    const updatedProject = {
      ...currentProject,
      resources: currentRes,
      resourceLogs: nextResourceLogs,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);

    if (isConseguido) {
      setSaveToast(costVal > 0 ? `¡Conseguido con S/. ${costVal.toFixed(2)}!` : '¡Conseguido!');
    } else if (state === 'por_terminar') {
      setSaveToast('Marcado como Por terminar (Rojo)');
    } else if (state === 'disponible') {
      setSaveToast('Marcado como Disponible (Verde)');
    } else if (isNinguno) {
      setSaveToast('Marcado como Ninguno (Sin recurso)');
    }
    setTimeout(() => setSaveToast(null), 1800);
  };

  // Multi-select batch actions & Mutual Exclusivity
  const handleToggleSelectActivity = (activityId: string) => {
    // Mutual exclusivity: selecting activity unselects groups
    setSelectedGroupIds([]);
    setSelectedActivityIds(prev =>
      prev.includes(activityId) ? prev.filter(id => id !== activityId) : [...prev, activityId]
    );
  };

  const handleToggleSelectAll = () => {
    if (!currentProject) return;
    setSelectedGroupIds([]);
    if (selectedActivityIds.length === currentProject.activities.length) {
      setSelectedActivityIds([]);
    } else {
      setSelectedActivityIds(currentProject.activities.map(a => a.id));
    }
  };

  const handleToggleSelectGroup = (groupId: string) => {
    // Mutual exclusivity: selecting group unselects activities
    setSelectedActivityIds([]);
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleBatchAssignGroup = (groupId: string | null) => {
    if (!currentProject || selectedActivityIds.length === 0) return;
    pushUndoSnapshot();

    const nextActivities = currentProject.activities.map(a =>
      selectedActivityIds.includes(a.id) ? { ...a, groupId } : a
    );
    const updatedProject = { ...currentProject, activities: nextActivities, updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setSelectedActivityIds([]);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleBatchCreateAndAssignGroup = (groupName: string) => {
    if (!currentProject) return;
    const newGroup = handleCreateGroup(groupName, '#6366f1');
    handleBatchAssignGroup(newGroup.id);
  };

  const handleBatchMarkCompleted = (completed: boolean) => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const nextActivities = currentProject.activities.map(a =>
      selectedActivityIds.includes(a.id) ? { ...a, isCompleted: completed } : a
    );
    const updatedProject = { ...currentProject, activities: nextActivities, updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setSelectedActivityIds([]);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleBatchDelete = () => {
    if (!currentProject) return;
    pushUndoSnapshot();

    const nextActivities = currentProject.activities.filter(
      a => !selectedActivityIds.includes(a.id)
    );
    const updatedProject = { ...currentProject, activities: nextActivities, updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setSelectedActivityIds([]);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  // Activity Reordering actions
  const handleMoveActivitiesUp = () => {
    if (!currentProject || selectedActivityIds.length === 0) return;
    pushUndoSnapshot();
    const list = [...currentProject.activities];
    for (let i = 0; i < list.length; i++) {
      if (selectedActivityIds.includes(list[i].id) && i > 0 && !selectedActivityIds.includes(list[i - 1].id)) {
        const temp = list[i];
        list[i] = list[i - 1];
        list[i - 1] = temp;
      }
    }
    const updatedProject = { ...currentProject, activities: list, updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleMoveActivitiesToStart = () => {
    if (!currentProject || selectedActivityIds.length === 0) return;
    pushUndoSnapshot();
    const selected = currentProject.activities.filter(a => selectedActivityIds.includes(a.id));
    const unselected = currentProject.activities.filter(a => !selectedActivityIds.includes(a.id));
    const updatedProject = { ...currentProject, activities: [...selected, ...unselected], updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleMoveActivitiesDown = () => {
    if (!currentProject || selectedActivityIds.length === 0) return;
    pushUndoSnapshot();
    const list = [...currentProject.activities];
    for (let i = list.length - 1; i >= 0; i--) {
      if (selectedActivityIds.includes(list[i].id) && i < list.length - 1 && !selectedActivityIds.includes(list[i + 1].id)) {
        const temp = list[i];
        list[i] = list[i + 1];
        list[i + 1] = temp;
      }
    }
    const updatedProject = { ...currentProject, activities: list, updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleMoveActivitiesToEnd = () => {
    if (!currentProject || selectedActivityIds.length === 0) return;
    pushUndoSnapshot();
    const selected = currentProject.activities.filter(a => selectedActivityIds.includes(a.id));
    const unselected = currentProject.activities.filter(a => !selectedActivityIds.includes(a.id));
    const updatedProject = { ...currentProject, activities: [...unselected, ...selected], updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  // Group Reordering actions
  const handleMoveGroupsUp = () => {
    if (!currentProject || selectedGroupIds.length === 0) return;
    pushUndoSnapshot();
    const list = [...currentProject.groups];
    for (let i = 0; i < list.length; i++) {
      if (selectedGroupIds.includes(list[i].id) && i > 0 && !selectedGroupIds.includes(list[i - 1].id)) {
        const temp = list[i];
        list[i] = list[i - 1];
        list[i - 1] = temp;
      }
    }
    const updatedProject = { ...currentProject, groups: list, updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleMoveGroupsToStart = () => {
    if (!currentProject || selectedGroupIds.length === 0) return;
    pushUndoSnapshot();
    const selected = currentProject.groups.filter(g => selectedGroupIds.includes(g.id));
    const unselected = currentProject.groups.filter(g => !selectedGroupIds.includes(g.id));
    const updatedProject = { ...currentProject, groups: [...selected, ...unselected], updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleMoveGroupsDown = () => {
    if (!currentProject || selectedGroupIds.length === 0) return;
    pushUndoSnapshot();
    const list = [...currentProject.groups];
    for (let i = list.length - 1; i >= 0; i--) {
      if (selectedGroupIds.includes(list[i].id) && i < list.length - 1 && !selectedGroupIds.includes(list[i + 1].id)) {
        const temp = list[i];
        list[i] = list[i + 1];
        list[i + 1] = temp;
      }
    }
    const updatedProject = { ...currentProject, groups: list, updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleMoveGroupsToEnd = () => {
    if (!currentProject || selectedGroupIds.length === 0) return;
    pushUndoSnapshot();
    const selected = currentProject.groups.filter(g => selectedGroupIds.includes(g.id));
    const unselected = currentProject.groups.filter(g => !selectedGroupIds.includes(g.id));
    const updatedProject = { ...currentProject, groups: [...unselected, ...selected], updatedAt: new Date().toISOString() };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  const handleDeleteSelectedGroups = () => {
    if (!currentProject || selectedGroupIds.length === 0) return;
    pushUndoSnapshot();
    const nextGroups = currentProject.groups.filter(g => !selectedGroupIds.includes(g.id));
    const nextActivities = currentProject.activities.map(a =>
      a.groupId && selectedGroupIds.includes(a.groupId) ? { ...a, groupId: null } : a
    );
    const updatedProject = {
      ...currentProject,
      groups: nextGroups,
      activities: nextActivities,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setSelectedGroupIds([]);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
  };

  // Import Handler
  const handleImportProject = (imported: Project, overwrite: boolean) => {
    pushUndoSnapshot();
    if (overwrite && currentProject) {
      const updated = { ...imported, id: currentProject.id };
      saveProject(updated);
      setCurrentProject(updated);
    } else {
      saveProject(imported);
      setCurrentProject(imported);
      setActiveProjectId(imported.id);
    }
    const freshList = getStoredProjects();
    setProjects(freshList);
    setHasUnsavedChanges(false);
    setSelectedActivityIds([]);
    setSaveToast('¡Proyecto importado con éxito!');
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Date Navigation Steppers
  const handlePrevDateWindow = () => {
    const diff = Math.round((windowEndDate.getTime() - windowStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const step = Math.min(Math.max(7, diff), 14);

    setWindowStartDate(prev => {
      const n = new Date(prev);
      n.setDate(prev.getDate() - step);
      return n;
    });
    setWindowEndDate(prev => {
      const n = new Date(prev);
      n.setDate(prev.getDate() - step);
      return n;
    });
  };

  const handleNextDateWindow = () => {
    const diff = Math.round((windowEndDate.getTime() - windowStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const step = Math.min(Math.max(7, diff), 14);

    setWindowStartDate(prev => {
      const n = new Date(prev);
      n.setDate(prev.getDate() + step);
      return n;
    });
    setWindowEndDate(prev => {
      const n = new Date(prev);
      n.setDate(prev.getDate() + step);
      return n;
    });
  };

  const handleTodayWindow = () => {
    const today = new Date();
    const s = new Date(today);
    s.setDate(today.getDate() - 2);
    const e = new Date(s);
    e.setDate(s.getDate() + 13);
    setWindowStartDate(s);
    setWindowEndDate(e);
  };

  const handleApplyCustomDateRange = (newStart: Date, newEnd: Date) => {
    setWindowStartDate(newStart);
    setWindowEndDate(newEnd);
  };

  const handleUpdateDailyMissionsVisibility = (visibleActivityIds: string[]) => {
    if (!currentProject) return;
    pushUndoSnapshot();
    const updatedProject: Project = {
      ...currentProject,
      dailyMissionsCustomIds: visibleActivityIds,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updatedProject);
    setHasUnsavedChanges(true);
    saveProject(updatedProject);
    setSaveToast('Misiones diarias actualizadas con éxito');
    setTimeout(() => setSaveToast(null), 2000);
  };

  // Today string
  const todayStr = getTodayDateString();

  // Pending daily missions count for yellow button badge
  const dailyPendingCount = useMemo(() => {
    if (!currentProject) return 0;
    const targetIds = (currentProject.dailyMissionsCustomIds && currentProject.dailyMissionsCustomIds.length > 0)
      ? currentProject.dailyMissionsCustomIds
      : currentProject.activities.filter(a => isActivityActiveOnDate(a, todayStr)).map(a => a.id);
    let pending = 0;
    for (const act of currentProject.activities) {
      if (!targetIds.includes(act.id)) continue;
      if (act.subActivities.length === 0) {
        if (!currentProject.completionLogs[`${act.id}_main_${todayStr}`]) {
          pending++;
        }
      } else {
        const allSubsDone = act.subActivities.every(
          sub => !!currentProject.completionLogs[`${act.id}_${sub.id}_${todayStr}`]
        );
        if (!allSubsDone) {
          pending++;
        }
      }
    }
    return pending;
  }, [currentProject, todayStr]);

  // Active activities count (for Guía tab)
  const activeActivitiesCount = useMemo(() => {
    if (!currentProject) return 0;
    return currentProject.activities.filter(a => {
      if (a.isCompleted) {
        const compDate = a.completedDate || a.endDate || a.startDate;
        if (compDate && compDate < todayStr) return false;
      }
      return true;
    }).length;
  }, [currentProject, todayStr]);

  // Past completed activities count (for Registro tab)
  const pastActivitiesCount = useMemo(() => {
    if (!currentProject) return 0;
    return currentProject.activities.filter(a => {
      if (!a.isCompleted) return false;
      const compDate = a.completedDate || a.endDate || a.startDate;
      return !!(compDate && compDate < todayStr);
    }).length;
  }, [currentProject, todayStr]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Bar with Project Breadcrumb, Guía / Registro Tabs, Undo/Redo, and Actions */}
      <TopBar
        projectName={currentProject?.name || 'Crear Proyecto'}
        onRenameProject={handleRenameProject}
        hasUnsavedChanges={hasUnsavedChanges}
        canUndo={undoStack.length > 0}
        onUndo={handleUndo}
        canRedo={redoStack.length > 0}
        onRedo={handleRedo}
        onSave={handleSaveProject}
        onOpenProjects={() => setIsProjectModalOpen(true)}
        onOpenNewActivity={() => {
          setEditingActivity(null);
          setIsActivityModalOpen(true);
        }}
        onOpenNewResource={() => {
          setEditingResource(null);
          setIsResourceModalOpen(true);
        }}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenGroups={() => {
          setEditingGroup(null);
          setIsGroupModalOpen(true);
        }}
        onOpenDailyMissions={() => setIsDailyMissionsOpen(true)}
        dailyPendingCount={dailyPendingCount}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-6 space-y-3 sm:space-y-4 max-w-full overflow-x-hidden">
        
        {/* Project Header Info */}
        {currentProject && (
          <div className="flex items-center justify-between gap-3 pb-1">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Directriz
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-semibold text-slate-700">{currentProject.name}</span>
                <span aria-hidden="true">·</span>
                <span>{activeActivitiesCount} actividades activas</span>
                <span aria-hidden="true">·</span>
                <span>{currentProject.resources?.length || 0} registros</span>
                <span aria-hidden="true">·</span>
                <span>{currentProject.groups.length} grupos</span>
                <span aria-hidden="true">·</span>
                <span>Hoy: {formatFriendlyDate(todayStr)}</span>
              </p>
            </div>
          </div>
        )}

        {/* Tab Selector: Guía | Registro */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('guia')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'guia'
                ? 'border-amber-500 text-slate-950 font-extrabold bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-amber-600" />
            <span>Guía</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('registro')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'registro'
                ? 'border-cyan-500 text-slate-950 font-extrabold bg-cyan-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-cyan-600" />
            <span>Registro</span>
          </button>
        </div>

        {/* TAB 1: GUÍA (MatrixGrid or Empty State) */}
        {activeTab === 'guia' && (
          <>
            {!currentProject || currentProject.activities.length === 0 ? (
              <EmptyState
                onAddActivity={() => {
                  setEditingActivity(null);
                  setIsActivityModalOpen(true);
                }}
                onLoadSample={handleLoadSampleProject}
              />
            ) : (
              <MatrixGrid
                days={days}
                activities={currentProject.activities}
                groups={currentProject.groups}
                completionLogs={currentProject.completionLogs}
                onToggleCell={handleToggleCell}
                onToggleParentDay={handleToggleParentDay}
                onToggleGroupDay={handleToggleGroupDay}
                onEditActivity={(act) => {
                  setEditingActivity(act);
                  setIsActivityModalOpen(true);
                }}
                onDeleteActivity={handleDeleteActivity}
                onAddSubActivityQuick={handleAddSubActivityQuick}
                onEditGroup={(group) => {
                  setEditingGroup(group);
                  setIsGroupModalOpen(true);
                }}
                onDeleteGroup={handleDeleteGroup}
                selectedActivityIds={selectedActivityIds}
                onToggleSelectActivity={handleToggleSelectActivity}
                onToggleSelectAll={handleToggleSelectAll}
                selectedGroupIds={selectedGroupIds}
                onToggleSelectGroup={handleToggleSelectGroup}
                onPrevDateWindow={handlePrevDateWindow}
                onNextDateWindow={handleNextDateWindow}
                onTodayWindow={handleTodayWindow}
                onOpenTimeSettings={() => setIsTimeSettingsOpen(true)}
                activeFilterGroup={activeFilterGroup}
                onSetFilterGroup={setActiveFilterGroup}
                onToggleActivityCompletion={handleToggleActivityCompletion}
                onCompleteActiveSlot={handleCompleteActiveSlot}
                onToggleSubInActiveSlot={handleToggleSubInActiveSlot}
              />
            )}
          </>
        )}

        {/* TAB 2: REGISTRO (RegistroMatrixGrid + Historial de actividades pasadas) */}
        {activeTab === 'registro' && currentProject && (
          <div className="space-y-4">
            {/* Matriz de Calendario de Registros y Gastos Diarios */}
            <RegistroMatrixGrid
              days={days}
              resources={currentProject.resources || []}
              groups={currentProject.groups || []}
              resourceLogs={currentProject.resourceLogs || {}}
              onToggleResourceBought={handleToggleResourceBought}
              onUpdateResourceDayCost={handleUpdateResourceDayCost}
              onUpdateResourceStatus={handleUpdateResourceStatus}
              onRenewResource={handleRenewResource}
              onSetDayResourceState={handleSetDayResourceState}
              onMoveResource={handleMoveResource}
              onAddResource={() => {
                setEditingResource(null);
                setIsResourceModalOpen(true);
              }}
              onEditResource={(res) => {
                setEditingResource(res);
                setIsResourceModalOpen(true);
              }}
              onDeleteResource={handleDeleteResource}
              onPrevDateWindow={handlePrevDateWindow}
              onNextDateWindow={handleNextDateWindow}
              onTodayWindow={handleTodayWindow}
              onOpenTimeSettings={() => setIsTimeSettingsOpen(true)}
              activeFilterGroup={activeFilterGroup}
              onSetFilterGroup={setActiveFilterGroup}
            />

            {/* Historial de actividades pasadas con paginación estilo Google Ads */}
            <HistoryActivitiesBox
              activities={currentProject.activities || []}
              groups={currentProject.groups || []}
              onToggleActivityCompletion={handleToggleActivityCompletion}
              onEditActivity={(act) => {
                setEditingActivity(act);
                setIsActivityModalOpen(true);
              }}
              onDeleteActivity={handleDeleteActivity}
            />
          </div>
        )}

      </main>

      {/* Floating Multi-Select Action Bar for Groups (only in Guía) */}
      {activeTab === 'guia' && selectedGroupIds.length > 0 && (
        <MultiSelectBar
          mode="groups"
          selectedCount={selectedGroupIds.length}
          groups={currentProject?.groups || []}
          onDeleteSelected={handleDeleteSelectedGroups}
          onClearSelection={() => setSelectedGroupIds([])}
          onMoveUp={handleMoveGroupsUp}
          onMoveToStart={handleMoveGroupsToStart}
          onMoveDown={handleMoveGroupsDown}
          onMoveToEnd={handleMoveGroupsToEnd}
        />
      )}

      {/* Floating Multi-Select Action Bar for Activities (only in Guía) */}
      {activeTab === 'guia' && selectedGroupIds.length === 0 && selectedActivityIds.length > 0 && (
        <MultiSelectBar
          mode="activities"
          selectedCount={selectedActivityIds.length}
          groups={currentProject?.groups || []}
          onAssignToGroup={handleBatchAssignGroup}
          onCreateAndAssignGroup={handleBatchCreateAndAssignGroup}
          onMarkSelectedCompleted={handleBatchMarkCompleted}
          onDeleteSelected={handleBatchDelete}
          onClearSelection={() => setSelectedActivityIds([])}
          onMoveUp={handleMoveActivitiesUp}
          onMoveToStart={handleMoveActivitiesToStart}
          onMoveDown={handleMoveActivitiesDown}
          onMoveToEnd={handleMoveActivitiesToEnd}
        />
      )}

      {/* Project Switcher Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        activeProjectId={currentProject?.id || null}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onLoadSampleProject={handleLoadSampleProject}
        isInitialOnboarding={projects.length === 0}
      />

      {/* Activity Create/Edit Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setEditingActivity(null);
        }}
        onSave={handleSaveActivity}
        initialActivity={editingActivity}
        groups={currentProject?.groups || []}
        onCreateGroup={(name, color, code, showBox, type) => handleCreateGroup(name, color, code, showBox, type)}
        onDeleteGroup={handleDeleteGroup}
        onUpdateGroup={handleUpdateGroup}
      />

      {/* Resource Create/Edit Modal */}
      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => {
          setIsResourceModalOpen(false);
          setEditingResource(null);
        }}
        onSave={handleSaveResource}
        initialResource={editingResource}
        groups={currentProject?.groups || []}
        onCreateGroup={(name, color, code, showBox, type) => handleCreateGroup(name, color, code, showBox, type)}
      />

      {/* Groups Management Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setEditingGroup(null);
        }}
        groups={currentProject?.groups || []}
        onCreateGroup={(name, color, code, showBox, type) => handleCreateGroup(name, color, code, showBox, type)}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onReorderGroups={handleReorderGroups}
        initialGroup={editingGroup}
        defaultType={activeTab === 'registro' ? 'resource' : 'activity'}
      />

      {/* Time Settings Modal (Calendario para establecer tiempos y presets 7, 14, 30 días) */}
      <TimeSettingsModal
        isOpen={isTimeSettingsOpen}
        onClose={() => setIsTimeSettingsOpen(false)}
        startDate={windowStartDate}
        endDate={windowEndDate}
        onApplyRange={handleApplyCustomDateRange}
      />

      {/* Import / Export Modal */}
      {currentProject && (
        <ImportExportModal
          isOpen={isImportExportOpen}
          onClose={() => setIsImportExportOpen(false)}
          currentProject={currentProject}
          onImportProject={handleImportProject}
        />
      )}

      {/* Daily Missions Drawer (Slides out smoothly from the left edge without backdrop blur) */}
      <DailyMissionsModal
        isOpen={isDailyMissionsOpen}
        onClose={() => setIsDailyMissionsOpen(false)}
        currentProject={currentProject}
        onToggleCell={handleToggleCell}
        onToggleParentDay={handleToggleParentDay}
        onUpdateProjectMissionsVisibility={handleUpdateDailyMissionsVisibility}
      />

    </div>
  );
}
