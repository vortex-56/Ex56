import { supabase } from './supabaseClient';
import { Project, Activity, ActivityGroup, Resource, Idea, DailyResourceLog } from '../types';
import { exportProjectToTXT } from '../utils/exportImport';

export interface SupabaseProjectRow {
  project_id: string;
  user_id: string;
  project_name: string;
}

/**
 * Loads all projects belonging to the logged-in user from the Supabase `projects` table
 * and hydrates their related entities (groups, activities, resources, completion_logs, resource_logs, ideas)
 * from their respective tables using `project_id`.
 */
export async function loadUserProjectsFromSupabase(userId: string): Promise<Project[]> {
  try {
    const { data: projectRows, error } = await supabase
      .from('projects')
      .select('project_id, user_id, project_name')
      .eq('user_id', userId);

    if (error) {
      console.warn('Advertencia al consultar la tabla projects en Supabase:', error.message);
      return [];
    }

    if (!projectRows || projectRows.length === 0) {
      return [];
    }

    const projects: Project[] = [];

    // Hydrate each project from its respective tables
    for (const row of projectRows) {
      const projectId = row.project_id;
      const projectName = row.project_name || 'Proyecto sin nombre';

      const project = await loadFullProjectFromSupabase(projectId, projectName);
      projects.push(project);
    }

    return projects;
  } catch (err) {
    console.error('Error cargando proyectos desde Supabase:', err);
    return [];
  }
}

/**
 * Loads a single project and its arrays from Supabase tables:
 * groups, activities, resources, completion_logs, resource_logs, ideas.
 */
export async function loadFullProjectFromSupabase(projectId: string, projectName: string): Promise<Project> {
  const now = new Date().toISOString();

  // 1. Groups
  let groups: ActivityGroup[] = [];
  try {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('project_id', projectId);
    if (data) {
      groups = data.map((g: any) => ({
        id: g.id || g.group_id,
        name: g.name || '',
        code: g.code || '',
        color: g.color || '#3b82f6',
        type: g.type || 'activity',
        showBox: g.show_box ?? g.showBox ?? true,
      }));
    }
  } catch (e) {
    console.warn('Error loading groups for project', projectId, e);
  }

  // 2. Activities
  let activities: Activity[] = [];
  try {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('project_id', projectId);
    if (data) {
      activities = data.map((a: any) => ({
        id: a.id || a.activity_id,
        code: a.code || '',
        groupId: a.group_id || a.groupId || '',
        name: a.name || '',
        color: a.color || '#3b82f6',
        startDate: a.start_date || a.startDate || now.slice(0, 10),
        hasEndDate: !!(a.has_end_date ?? a.hasEndDate),
        endDate: a.end_date || a.endDate || null,
        isCompleted: !!(a.is_completed ?? a.isCompleted),
        completedDate: a.completed_date || a.completedDate || null,
        scheduleType: a.schedule_type || a.scheduleType || 'daily',
        activeDays: a.active_days || a.activeDays || [0, 1, 2, 3, 4, 5, 6],
        blockSize: a.block_size ?? a.blockSize ?? undefined,
        clusterSize: a.cluster_size ?? a.clusterSize ?? undefined,
        dayValue: a.day_value ?? a.dayValue ?? undefined,
        subActivities: a.sub_activities || a.subActivities || [],
        notes: a.notes || undefined,
      }));
    }
  } catch (e) {
    console.warn('Error loading activities for project', projectId, e);
  }

  // 3. Resources
  let resources: Resource[] = [];
  try {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('project_id', projectId);
    if (data) {
      resources = data.map((r: any) => ({
        id: r.id || r.resource_id,
        code: r.code || '',
        groupId: r.group_id || r.groupId || '',
        name: r.name || '',
        hasCost: !!(r.has_cost ?? r.hasCost),
        cost: Number(r.cost ?? 0),
        hasDurationStatus: !!(r.has_duration_status ?? r.hasDurationStatus),
        lastRenewedDate: r.last_renewed_date || r.lastRenewedDate || null,
        possessionStatus: r.possession_status || r.possessionStatus || 'se_tiene',
        availabilityStatus: r.availability_status || r.availabilityStatus || 'disponible',
        consumptionType: r.consumption_type || r.consumptionType || 'durable_seasonal',
        cycles: r.cycles || [],
        notes: r.notes || undefined,
        resourceNature: r.resource_nature || r.resourceNature || 'expense',
        order: r.order !== undefined ? Number(r.order) : undefined,
        createdAt: r.created_at || r.createdAt || now,
        updatedAt: r.updated_at || r.updatedAt || now,
      }));
    }
  } catch (e) {
    console.warn('Error loading resources for project', projectId, e);
  }

  // 4. Completion Logs
  const completionLogs: Record<string, boolean> = {};
  try {
    let res = await supabase.from('completion_logs').select('*').eq('project_id', projectId);
    if (res.error) {
      res = await supabase.from('completionlogs').select('*').eq('project_id', projectId);
    }
    if (res.data) {
      for (const row of res.data) {
        const key = row.log_key || row.key;
        if (key && (row.completed || row.is_completed || row.completed === undefined)) {
          completionLogs[key] = true;
        }
      }
    }
  } catch (e) {
    console.warn('Error loading completion logs for project', projectId, e);
  }

  // 5. Resource Logs
  const resourceLogs: Record<string, DailyResourceLog> = {};
  try {
    let res = await supabase.from('resource_logs').select('*').eq('project_id', projectId);
    if (res.error) {
      res = await supabase.from('resourcelogs').select('*').eq('project_id', projectId);
    }
    if (res.data) {
      for (const row of res.data) {
        const key = row.log_key || row.key;
        if (key) {
          resourceLogs[key] = {
            cost: Number(row.cost ?? 0),
            bought: !!row.bought,
            renewed: !!row.renewed,
            state: row.state || undefined,
          };
        }
      }
    }
  } catch (e) {
    console.warn('Error loading resource logs for project', projectId, e);
  }

  // 6. Ideas
  let ideas: Idea[] = [];
  try {
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });
    if (data) {
      ideas = data.map((idea: any) => ({
        id: idea.id || idea.idea_id,
        title: idea.title || 'Idea',
        boxColor: idea.box_color || idea.boxColor || '#FFFFFF',
        order: Number(idea.order ?? 0),
        collapsed: !!idea.collapsed,
        createdAt: idea.created_at || idea.createdAt || now,
        updatedAt: idea.updated_at || idea.updatedAt || now,
        phrases: idea.phrases || [],
        contentHtml: idea.content_html || idea.contentHtml || undefined,
      }));
    }
  } catch (e) {
    console.warn('Error loading ideas for project', projectId, e);
  }

  return {
    id: projectId,
    name: projectName,
    createdAt: now,
    updatedAt: now,
    groups,
    activities,
    resources,
    ideas,
    completionLogs,
    resourceLogs,
  };
}

/**
 * Inserts / saves all child arrays (groups, activities, resources, completion_logs, resource_logs, ideas)
 * into their respective Supabase tables using `project_id`.
 */
export async function saveProjectArraysToSupabase(projectId: string, project: Project): Promise<void> {
  // 1. GROUPS table
  try {
    await supabase.from('groups').delete().eq('project_id', projectId);
    if (project.groups && project.groups.length > 0) {
      const rows = project.groups.map(g => ({
        project_id: projectId,
        id: g.id,
        name: g.name,
        code: g.code || '',
        color: g.color || '#3b82f6',
        type: g.type || 'activity',
        show_box: g.showBox ?? true,
      }));
      const { error } = await supabase.from('groups').insert(rows);
      if (error) {
        // Fallback for showBox column name
        const fallbackRows = rows.map(r => ({ ...r, showBox: r.show_box }));
        try {
          await supabase.from('groups').insert(fallbackRows);
        } catch {
          // ignore fallback error
        }
      }
    }
  } catch (err) {
    console.warn('Error saving groups to Supabase:', err);
  }

  // 2. ACTIVITIES table
  try {
    await supabase.from('activities').delete().eq('project_id', projectId);
    if (project.activities && project.activities.length > 0) {
      const rows = project.activities.map(a => ({
        project_id: projectId,
        id: a.id,
        group_id: a.groupId || null,
        code: a.code || '',
        name: a.name,
        color: a.color || '#3b82f6',
        start_date: a.startDate,
        has_end_date: !!a.hasEndDate,
        end_date: a.endDate || null,
        is_completed: !!a.isCompleted,
        completed_date: a.completedDate || null,
        schedule_type: a.scheduleType || 'daily',
        active_days: a.activeDays || [0, 1, 2, 3, 4, 5, 6],
        block_size: a.blockSize ?? null,
        cluster_size: a.clusterSize ?? null,
        day_value: a.dayValue ?? null,
        sub_activities: a.subActivities || [],
        notes: a.notes || null,
      }));
      await supabase.from('activities').insert(rows);
    }
  } catch (err) {
    console.warn('Error saving activities to Supabase:', err);
  }

  // 3. RESOURCES table
  try {
    await supabase.from('resources').delete().eq('project_id', projectId);
    if (project.resources && project.resources.length > 0) {
      const rows = project.resources.map(r => ({
        project_id: projectId,
        id: r.id,
        group_id: r.groupId || null,
        code: r.code || '',
        name: r.name,
        has_cost: !!r.hasCost,
        cost: r.cost ?? 0,
        has_duration_status: !!r.hasDurationStatus,
        last_renewed_date: r.lastRenewedDate || null,
        possession_status: r.possessionStatus || 'se_tiene',
        availability_status: r.availabilityStatus || 'disponible',
        consumption_type: r.consumptionType || 'durable_seasonal',
        cycles: r.cycles || [],
        notes: r.notes || null,
        resource_nature: r.resourceNature || 'expense',
        order: r.order ?? 0,
      }));
      await supabase.from('resources').insert(rows);
    }
  } catch (err) {
    console.warn('Error saving resources to Supabase:', err);
  }

  // 4. COMPLETION_LOGS table
  try {
    let tableName = 'completion_logs';
    let delRes = await supabase.from(tableName).delete().eq('project_id', projectId);
    if (delRes.error) {
      tableName = 'completionlogs';
      await supabase.from(tableName).delete().eq('project_id', projectId);
    }

    const logEntries = Object.entries(project.completionLogs || {}).filter(([_, val]) => !!val);
    if (logEntries.length > 0) {
      const rows = logEntries.map(([key]) => ({
        project_id: projectId,
        log_key: key,
        completed: true,
      }));
      const { error } = await supabase.from(tableName).insert(rows);
      if (error) {
        // Fallback for column 'key'
        const altRows = rows.map(r => ({ project_id: r.project_id, key: r.log_key, completed: true }));
        try {
          await supabase.from(tableName).insert(altRows);
        } catch {
          // ignore fallback error
        }
      }
    }
  } catch (err) {
    console.warn('Error saving completion logs to Supabase:', err);
  }

  // 5. RESOURCE_LOGS table
  try {
    let tableName = 'resource_logs';
    let delRes = await supabase.from(tableName).delete().eq('project_id', projectId);
    if (delRes.error) {
      tableName = 'resourcelogs';
      await supabase.from(tableName).delete().eq('project_id', projectId);
    }

    const resLogEntries = Object.entries(project.resourceLogs || {});
    if (resLogEntries.length > 0) {
      const rows = resLogEntries.map(([key, val]) => ({
        project_id: projectId,
        log_key: key,
        cost: val.cost ?? 0,
        bought: !!val.bought,
        renewed: !!val.renewed,
        state: val.state || null,
      }));
      const { error } = await supabase.from(tableName).insert(rows);
      if (error) {
        // Fallback for column 'key'
        const altRows = rows.map(r => ({
          project_id: r.project_id,
          key: r.log_key,
          cost: r.cost,
          bought: r.bought,
          renewed: r.renewed,
          state: r.state,
        }));
        try {
          await supabase.from(tableName).insert(altRows);
        } catch {
          // ignore fallback error
        }
      }
    }
  } catch (err) {
    console.warn('Error saving resource logs to Supabase:', err);
  }

  // 6. IDEAS table
  try {
    await supabase.from('ideas').delete().eq('project_id', projectId);
    if (project.ideas && project.ideas.length > 0) {
      const rows = project.ideas.map(idea => ({
        project_id: projectId,
        id: idea.id,
        title: idea.title,
        box_color: idea.boxColor || '#FFFFFF',
        order: idea.order ?? 0,
        collapsed: !!idea.collapsed,
        phrases: idea.phrases || [],
        content_html: idea.contentHtml || null,
      }));
      await supabase.from('ideas').insert(rows);
    }
  } catch (err) {
    console.warn('Error saving ideas to Supabase:', err);
  }
}

/**
 * Inserts a new project into the Supabase `projects` table (project_id, user_id, project_name ONLY - NO data column)
 * and then inserts its related arrays into their respective tables.
 */
export async function insertProjectIntoSupabase(userId: string, project: Project): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Insert into `projects` table with ONLY: project_id, user_id, project_name
    const { error: projError } = await supabase
      .from('projects')
      .upsert([
        {
          project_id: project.id,
          user_id: userId,
          project_name: project.name,
        },
      ], { onConflict: 'project_id' });

    if (projError) {
      console.error('Error insertando en la tabla projects:', projError.message);
      return { success: false, error: projError.message };
    }

    // 2. Insert related data into groups, activities, resources, etc. tables
    await saveProjectArraysToSupabase(project.id, project);

    return { success: true };
  } catch (err: any) {
    console.error('Error al crear proyecto en Supabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

/**
 * Updates an existing project in the Supabase `projects` table (project_name)
 * and updates its arrays in their respective tables.
 */
export async function updateProjectInSupabase(userId: string, project: Project): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Update project_name in `projects` table
    const { error: projError } = await supabase
      .from('projects')
      .update({
        project_name: project.name,
      })
      .eq('project_id', project.id)
      .eq('user_id', userId);

    if (projError) {
      console.warn('Error actualizando project_name en projects:', projError.message);
    }

    // 2. Sync groups, activities, resources, completion_logs, resource_logs, ideas
    await saveProjectArraysToSupabase(project.id, project);

    return { success: true };
  } catch (err: any) {
    console.error('Error actualizando proyecto en Supabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

/**
 * Deletes a project from the Supabase `projects` table and all its respective child tables.
 */
export async function deleteProjectFromSupabase(userId: string, projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Delete child tables
    await supabase.from('groups').delete().eq('project_id', projectId);
    await supabase.from('activities').delete().eq('project_id', projectId);
    await supabase.from('resources').delete().eq('project_id', projectId);
    await supabase.from('completion_logs').delete().eq('project_id', projectId);
    await supabase.from('resource_logs').delete().eq('project_id', projectId);
    await supabase.from('ideas').delete().eq('project_id', projectId);

    // 2. Delete parent project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error eliminando proyecto de Supabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

/**
 * IMPORT TXT TO SUPABASE:
 * 1. Reads the .txt string.
 * 2. Finds text between === PLANMATRIX_RAW_DATA_START === and === PLANMATRIX_RAW_DATA_END ===.
 * 3. Extracts that JSON.
 * 4. Inserts/upserts project record in `projects` (project_id, user_id, project_name).
 * 5. Uses supabase.from('...').insert() to save each array (groups, activities, resources, completionLogs, resourceLogs, ideas)
 *    into their respective Supabase tables assigning them the correct `project_id`.
 */
export async function importProjectFromTXTToSupabase(
  txtContent: string,
  userId: string,
  targetProjectId?: string
): Promise<{ success: boolean; project?: Project; error?: string }> {
  try {
    const startTag = '=== PLANMATRIX_RAW_DATA_START ===';
    const endTag = '=== PLANMATRIX_RAW_DATA_END ===';

    if (!txtContent.includes(startTag) || !txtContent.includes(endTag)) {
      throw new Error('El archivo TXT no contiene las etiquetas requeridas === PLANMATRIX_RAW_DATA_START === y === PLANMATRIX_RAW_DATA_END ===.');
    }

    const jsonStr = txtContent.split(startTag)[1].split(endTag)[0].trim();
    const rawProject = JSON.parse(jsonStr);

    if (!rawProject || typeof rawProject !== 'object') {
      throw new Error('El bloque de datos extraído no es un JSON válido.');
    }

    const projectId = targetProjectId || rawProject.id || ('proj_' + Math.random().toString(36).substring(2, 9));
    const projectName = rawProject.name || 'Proyecto Importado';

    const project: Project = {
      id: projectId,
      name: projectName,
      createdAt: rawProject.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groups: rawProject.groups || [],
      activities: rawProject.activities || [],
      resources: rawProject.resources || [],
      ideas: rawProject.ideas || [],
      completionLogs: rawProject.completionLogs || {},
      resourceLogs: rawProject.resourceLogs || {},
    };

    // 1. Save into `projects` table (project_id, user_id, project_name)
    const { error: projError } = await supabase.from('projects').upsert([
      {
        project_id: projectId,
        user_id: userId,
        project_name: projectName,
      },
    ], { onConflict: 'project_id' });

    if (projError) {
      console.warn('Aviso al insertar en tabla projects:', projError.message);
    }

    // 2. Save arrays into respective tables in Supabase (groups, activities, resources, etc.)
    await saveProjectArraysToSupabase(projectId, project);

    return { success: true, project };
  } catch (err: any) {
    console.error('Error importando TXT a Supabase:', err);
    return { success: false, error: err?.message || 'Error al importar archivo TXT' };
  }
}

/**
 * EXPORT TXT FROM SUPABASE:
 * Reads from all Supabase tables (projects, groups, activities, resources, completion_logs, resource_logs, ideas)
 * for the given project_id and reconstructs the TXT export file with the human-readable summary
 * and the exact raw JSON block between === PLANMATRIX_RAW_DATA_START === and === PLANMATRIX_RAW_DATA_END ===.
 */
export async function exportProjectFromSupabaseToTXT(projectId: string, fallbackProject?: Project): Promise<string> {
  try {
    // 1. Fetch project name
    const { data: projData } = await supabase
      .from('projects')
      .select('project_id, project_name')
      .eq('project_id', projectId)
      .maybeSingle();

    const projectName = projData?.project_name || fallbackProject?.name || 'Mi Proyecto';

    // 2. Fetch all child data from Supabase tables
    const projectFromSupabase = await loadFullProjectFromSupabase(projectId, projectName);

    // If Supabase returned empty child tables but fallbackProject is provided with local data, merge cleanly
    const finalProject: Project = {
      id: projectId,
      name: projectName,
      createdAt: fallbackProject?.createdAt || projectFromSupabase.createdAt,
      updatedAt: new Date().toISOString(),
      groups: (projectFromSupabase?.groups && projectFromSupabase.groups.length > 0) ? projectFromSupabase.groups : (fallbackProject?.groups || []),
      activities: (projectFromSupabase?.activities && projectFromSupabase.activities.length > 0) ? projectFromSupabase.activities : (fallbackProject?.activities || []),
      resources: (projectFromSupabase?.resources && projectFromSupabase.resources.length > 0) ? projectFromSupabase.resources : (fallbackProject?.resources || []),
      ideas: (projectFromSupabase?.ideas && projectFromSupabase.ideas.length > 0) ? projectFromSupabase.ideas : (fallbackProject?.ideas || []),
      completionLogs: (projectFromSupabase?.completionLogs && Object.keys(projectFromSupabase.completionLogs).length > 0) ? projectFromSupabase.completionLogs : (fallbackProject?.completionLogs || {}),
      resourceLogs: (projectFromSupabase?.resourceLogs && Object.keys(projectFromSupabase.resourceLogs).length > 0) ? projectFromSupabase.resourceLogs : (fallbackProject?.resourceLogs || {}),
    };

    // 3. Reconstruct exact TXT format
    return exportProjectToTXT(finalProject);
  } catch (err) {
    console.warn('Error leyendo desde Supabase para exportar TXT, usando datos locales:', err);
    if (fallbackProject) {
      return exportProjectToTXT(fallbackProject);
    }
    throw err;
  }
}
