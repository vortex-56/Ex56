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
    console.log('🔄 [Supabase] Consultando tabla projects para user_id:', userId);
    const { data: projectRows, error } = await supabase
      .from('projects')
      .select('project_id, user_id, project_name')
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [Supabase] Error al consultar la tabla projects:', error.message);
      return [];
    }

    if (!projectRows || projectRows.length === 0) {
      console.log('ℹ️ [Supabase] No se encontraron proyectos para este usuario.');
      return [];
    }

    console.log(`✅ [Supabase] Se encontraron ${projectRows.length} proyecto(s). Hidratando datos...`);
    const projects: Project[] = [];

    // Hydrate each project from its respective tables
    for (const row of projectRows) {
      const projectId = row.project_id;
      const projectName = row.project_name || 'Proyecto sin nombre';

      const project = await loadFullProjectFromSupabase(projectId, projectName);
      projects.push(project);
    }

    console.log('✅ [Supabase] Proyectos cargados con éxito desde la base de datos:', projects);
    return projects;
  } catch (err) {
    console.error('❌ [Supabase] Error cargando proyectos desde Supabase:', err);
    return [];
  }
}

/**
 * Loads a single project and its arrays from Supabase tables:
 * groups, activities, resources, completion_logs, resource_logs, ideas.
 */
export async function loadFullProjectFromSupabase(projectId: string, projectName: string): Promise<Project> {
  const now = new Date().toISOString();

  // 1. Groups (group_id, project_id, group_code, group_name, color, show_box, type)
  let groups: ActivityGroup[] = [];
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('project_id', projectId);
    if (error) {
      console.warn('⚠️ [Supabase] Aviso al cargar groups:', error.message);
    } else if (data) {
      groups = data.map((g: any) => ({
        id: g.group_id || g.id,
        name: g.group_name || g.name || '',
        code: g.group_code || g.code || '',
        color: g.color || '#3b82f6',
        type: g.type || 'activity',
        showBox: g.show_box ?? g.showBox ?? true,
      }));
    }
  } catch (e) {
    console.warn('⚠️ [Supabase] Error loading groups for project', projectId, e);
  }

  // 2. Activities (activity_id, project_id, group_id, activity_code, name, color, start_date, has_end_date, end_date, is_completed, completed_date, schedule_type, active_days, block_size, cluster_size, day_value, sub_activities_json)
  let activities: Activity[] = [];
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('project_id', projectId);
    if (error) {
      console.warn('⚠️ [Supabase] Aviso al cargar activities:', error.message);
    } else if (data) {
      activities = data.map((a: any) => {
        let subActs = a.sub_activities_json ?? a.sub_activities ?? a.subActivities ?? [];
        if (typeof subActs === 'string') {
          try { subActs = JSON.parse(subActs); } catch { subActs = []; }
        }
        if (!Array.isArray(subActs)) subActs = [];

        let actDays = a.active_days ?? a.activeDays ?? [0, 1, 2, 3, 4, 5, 6];
        if (typeof actDays === 'string') {
          try { actDays = JSON.parse(actDays); } catch { actDays = [0, 1, 2, 3, 4, 5, 6]; }
        }

        return {
          id: a.activity_id || a.id,
          code: a.activity_code || a.code || '',
          groupId: a.group_id || a.groupId || '',
          name: a.name || '',
          color: a.color || '#3b82f6',
          startDate: a.start_date || a.startDate || now.slice(0, 10),
          hasEndDate: !!(a.has_end_date ?? a.hasEndDate),
          endDate: a.end_date || a.endDate || null,
          isCompleted: !!(a.is_completed ?? a.isCompleted),
          completedDate: a.completed_date || a.completedDate || null,
          scheduleType: a.schedule_type || a.scheduleType || 'daily',
          activeDays: actDays,
          blockSize: a.block_size ?? a.blockSize ?? undefined,
          clusterSize: a.cluster_size ?? a.clusterSize ?? undefined,
          dayValue: a.day_value ?? a.dayValue ?? undefined,
          subActivities: subActs,
          notes: a.notes || undefined,
        };
      });
    }
  } catch (e) {
    console.warn('⚠️ [Supabase] Error loading activities for project', projectId, e);
  }

  // 3. Resources (resource_id, project_id, group_id, resource_code, name, has_cost, cost, has_duration_status, last_renewed_date, possession_status, availability_status, consumption_type, cycles_json, notes, resource_nature, order_index)
  let resources: Resource[] = [];
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('project_id', projectId);
    if (error) {
      console.warn('⚠️ [Supabase] Aviso al cargar resources:', error.message);
    } else if (data) {
      resources = data.map((r: any) => {
        let cycles = r.cycles_json ?? r.cycles ?? [];
        if (typeof cycles === 'string') {
          try { cycles = JSON.parse(cycles); } catch { cycles = []; }
        }
        if (!Array.isArray(cycles)) cycles = [];

        return {
          id: r.resource_id || r.id,
          code: r.resource_code || r.code || '',
          groupId: r.group_id || r.groupId || '',
          name: r.name || '',
          hasCost: !!(r.has_cost ?? r.hasCost),
          cost: Number(r.cost ?? 0),
          hasDurationStatus: !!(r.has_duration_status ?? r.hasDurationStatus),
          lastRenewedDate: r.last_renewed_date || r.lastRenewedDate || null,
          possessionStatus: r.possession_status || r.possessionStatus || 'se_tiene',
          availabilityStatus: r.availability_status || r.availabilityStatus || 'disponible',
          consumptionType: r.consumption_type || r.consumptionType || 'durable_seasonal',
          cycles,
          notes: r.notes || undefined,
          resourceNature: r.resource_nature || r.resourceNature || 'expense',
          order: r.order_index !== undefined ? Number(r.order_index) : (r.order !== undefined ? Number(r.order) : undefined),
          createdAt: r.created_at || r.createdAt || now,
          updatedAt: r.updated_at || r.updatedAt || now,
        };
      });
    }
  } catch (e) {
    console.warn('⚠️ [Supabase] Error loading resources for project', projectId, e);
  }

  // 4. Completion Logs (log_key, project_id, activity_id, sub_activity_id, log_date, completed)
  const completionLogs: Record<string, boolean> = {};
  try {
    const { data, error } = await supabase
      .from('completion_logs')
      .select('*')
      .eq('project_id', projectId);
    if (error) {
      console.warn('⚠️ [Supabase] Aviso al cargar completion_logs:', error.message);
    } else if (data) {
      for (const row of data) {
        const key = row.log_key || row.key;
        if (key && (row.completed || row.is_completed || row.completed === undefined)) {
          completionLogs[key] = true;
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ [Supabase] Error loading completion logs for project', projectId, e);
  }

  // 5. Resource Logs (log_key, project_id, resource_id, log_date, cost, bought, renewed, state)
  const resourceLogs: Record<string, DailyResourceLog> = {};
  try {
    const { data, error } = await supabase
      .from('resource_logs')
      .select('*')
      .eq('project_id', projectId);
    if (error) {
      console.warn('⚠️ [Supabase] Aviso al cargar resource_logs:', error.message);
    } else if (data) {
      for (const row of data) {
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
    console.warn('⚠️ [Supabase] Error loading resource logs for project', projectId, e);
  }

  // 6. Ideas (idea_id, project_id, title, box_color, content_html, phrases_json, order_index, collapsed)
  let ideas: Idea[] = [];
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
    if (error) {
      console.warn('⚠️ [Supabase] Aviso al cargar ideas:', error.message);
    } else if (data) {
      ideas = data.map((idea: any) => {
        let phrases = idea.phrases_json ?? idea.phrases ?? [];
        if (typeof phrases === 'string') {
          try { phrases = JSON.parse(phrases); } catch { phrases = []; }
        }
        if (!Array.isArray(phrases)) phrases = [];

        return {
          id: idea.idea_id || idea.id,
          title: idea.title || 'Idea',
          boxColor: idea.box_color || idea.boxColor || '#FFFFFF',
          order: Number(idea.order_index ?? idea.order ?? 0),
          collapsed: !!idea.collapsed,
          createdAt: idea.created_at || idea.createdAt || now,
          updatedAt: idea.updated_at || idea.updatedAt || now,
          phrases,
          contentHtml: idea.content_html || idea.contentHtml || undefined,
        };
      });
    }
  } catch (e) {
    console.warn('⚠️ [Supabase] Error loading ideas for project', projectId, e);
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
 * Inserts a new project record into Supabase `projects` (project_id, user_id, project_name)
 * and then saves all its children (groups, activities, resources, etc.).
 */
export async function insertProjectIntoSupabase(userId: string, project: Project): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 [Supabase] Insertando proyecto en tabla projects:', {
      project_id: project.id,
      user_id: userId,
      project_name: project.name,
    });

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
      console.error('❌ [Supabase] Error insertando en la tabla projects:', projError.message);
      return { success: false, error: projError.message };
    }

    console.log('✅ [Supabase] Proyecto creado en tabla projects correctamente.');
    const childRes = await saveProjectArraysToSupabase(project.id, project);
    if (!childRes.success) {
      return childRes;
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error al crear proyecto en Supabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

/**
 * Saves all child arrays (groups, activities, resources, completion_logs, resource_logs, ideas)
 * into their respective Supabase tables using `project_id`.
 */
export async function saveProjectArraysToSupabase(projectId: string, project: Project): Promise<{ success: boolean; error?: string }> {
  // 1. GROUPS table (group_id, project_id, group_code, group_name, color, show_box, type)
  try {
    if (project.groups && project.groups.length > 0) {
      const rows = project.groups.map(g => ({
        group_id: g.id,
        project_id: projectId,
        group_code: g.code || '',
        group_name: g.name,
        color: g.color || '#3b82f6',
        show_box: g.showBox ?? true,
        type: g.type || 'activity',
      }));
      const { error } = await supabase.from('groups').upsert(rows, { onConflict: 'group_id' });
      if (error) {
        console.error('❌ [Supabase] Error guardando groups:', error.message);
        return { success: false, error: `Error en groups: ${error.message}` };
      }
      console.log(`✅ [Supabase] Guardados ${rows.length} grupos.`);
    }
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveProjectArrays -> groups:', err);
    return { success: false, error: err?.message || 'Error en groups' };
  }

  // 2. ACTIVITIES table (activity_id, project_id, group_id, activity_code, name, color, start_date, has_end_date, end_date, is_completed, completed_date, schedule_type, active_days, block_size, cluster_size, day_value, sub_activities_json)
  try {
    if (project.activities && project.activities.length > 0) {
      const rows = project.activities.map(a => ({
        activity_id: a.id,
        project_id: projectId,
        group_id: a.groupId || null,
        activity_code: a.code || '',
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
        sub_activities_json: a.subActivities || [],
      }));
      const { error } = await supabase.from('activities').upsert(rows, { onConflict: 'activity_id' });
      if (error) {
        console.error('❌ [Supabase] Error guardando activities:', error.message);
        return { success: false, error: `Error en activities: ${error.message}` };
      }
      console.log(`✅ [Supabase] Guardadas ${rows.length} actividades.`);
    }
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveProjectArrays -> activities:', err);
    return { success: false, error: err?.message || 'Error en activities' };
  }

  // 3. RESOURCES table (resource_id, project_id, group_id, resource_code, name, has_cost, cost, has_duration_status, last_renewed_date, possession_status, availability_status, consumption_type, cycles_json, notes, resource_nature, order_index)
  try {
    if (project.resources && project.resources.length > 0) {
      const rows = project.resources.map(r => ({
        resource_id: r.id,
        project_id: projectId,
        group_id: r.groupId || null,
        resource_code: r.code || '',
        name: r.name,
        has_cost: !!r.hasCost,
        cost: r.cost ?? 0,
        has_duration_status: !!r.hasDurationStatus,
        last_renewed_date: r.lastRenewedDate || null,
        possession_status: r.possessionStatus || 'se_tiene',
        availability_status: r.availabilityStatus || 'disponible',
        consumption_type: r.consumptionType || 'durable_seasonal',
        cycles_json: r.cycles || [],
        notes: r.notes || null,
        resource_nature: r.resourceNature || 'expense',
        order_index: r.order ?? 0,
      }));
      const { error } = await supabase.from('resources').upsert(rows, { onConflict: 'resource_id' });
      if (error) {
        console.error('❌ [Supabase] Error guardando resources:', error.message);
        return { success: false, error: `Error en resources: ${error.message}` };
      }
      console.log(`✅ [Supabase] Guardados ${rows.length} recursos.`);
    }
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveProjectArrays -> resources:', err);
    return { success: false, error: err?.message || 'Error en resources' };
  }

  // 4. COMPLETION_LOGS table (log_key, project_id, activity_id, sub_activity_id, log_date, completed)
  try {
    const logEntries = Object.entries(project.completionLogs || {}).filter(([_, val]) => !!val);
    if (logEntries.length > 0) {
      const rows = logEntries.map(([key]) => {
        const parsed = parseCompletionLogKey(key);
        return {
          log_key: key,
          project_id: projectId,
          activity_id: parsed.activityId,
          sub_activity_id: parsed.subActivityId,
          log_date: parsed.dateStr,
          completed: true,
        };
      });
      const { error } = await supabase.from('completion_logs').upsert(rows, { onConflict: 'log_key' });
      if (error) {
        console.error('❌ [Supabase] Error guardando completion_logs:', error.message);
        return { success: false, error: `Error en completion_logs: ${error.message}` };
      }
      console.log(`✅ [Supabase] Guardados ${rows.length} completion_logs.`);
    }
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveProjectArrays -> completion_logs:', err);
    return { success: false, error: err?.message || 'Error en completion_logs' };
  }

  // 5. RESOURCE_LOGS table (log_key, project_id, resource_id, log_date, cost, bought, renewed, state)
  try {
    const resLogEntries = Object.entries(project.resourceLogs || {});
    if (resLogEntries.length > 0) {
      const rows = resLogEntries.map(([key, val]) => {
        const parsed = parseResourceLogKey(key);
        return {
          log_key: key,
          project_id: projectId,
          resource_id: parsed.resourceId,
          log_date: parsed.dateStr,
          cost: val.cost ?? 0,
          bought: !!val.bought,
          renewed: !!val.renewed,
          state: val.state || null,
        };
      });
      const { error } = await supabase.from('resource_logs').upsert(rows, { onConflict: 'log_key' });
      if (error) {
        console.error('❌ [Supabase] Error guardando resource_logs:', error.message);
        return { success: false, error: `Error en resource_logs: ${error.message}` };
      }
      console.log(`✅ [Supabase] Guardados ${rows.length} resource_logs.`);
    }
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveProjectArrays -> resource_logs:', err);
    return { success: false, error: err?.message || 'Error en resource_logs' };
  }

  // 6. IDEAS table (idea_id, project_id, title, box_color, content_html, phrases_json, order_index, collapsed)
  try {
    if (project.ideas && project.ideas.length > 0) {
      const rows = project.ideas.map(idea => ({
        idea_id: idea.id,
        project_id: projectId,
        title: idea.title,
        box_color: idea.boxColor || '#FFFFFF',
        content_html: idea.contentHtml || null,
        phrases_json: idea.phrases || [],
        order_index: idea.order ?? 0,
        collapsed: !!idea.collapsed,
      }));
      const { error } = await supabase.from('ideas').upsert(rows, { onConflict: 'idea_id' });
      if (error) {
        console.error('❌ [Supabase] Error guardando ideas:', error.message);
        return { success: false, error: `Error en ideas: ${error.message}` };
      }
      console.log(`✅ [Supabase] Guardadas ${rows.length} ideas.`);
    }
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveProjectArrays -> ideas:', err);
    return { success: false, error: err?.message || 'Error en ideas' };
  }

  return { success: true };
}

/**
 * Updates or inserts project in `projects` table (upsert) and updates all its child tables.
 */
export async function updateProjectInSupabase(userId: string, project: Project): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 [Supabase] Guardando proyecto en tabla projects (upsert):', {
      project_id: project.id,
      user_id: userId,
      project_name: project.name,
    });

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
      console.error('❌ [Supabase] Error en updateProjectInSupabase (projects):', projError.message);
      return { success: false, error: projError.message };
    }

    const arraysRes = await saveProjectArraysToSupabase(project.id, project);
    if (!arraysRes.success) {
      return arraysRes;
    }

    console.log('✅ [Supabase] Proyecto actualizado por completo:', project.id);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error actualizando proyecto en Supabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

/**
 * Deletes a project from the Supabase `projects` table and all its respective child tables.
 */
export async function deleteProjectFromSupabase(userId: string, projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('completion_logs').delete().eq('project_id', projectId);
    await supabase.from('resource_logs').delete().eq('project_id', projectId);
    await supabase.from('ideas').delete().eq('project_id', projectId);
    await supabase.from('activities').delete().eq('project_id', projectId);
    await supabase.from('resources').delete().eq('project_id', projectId);
    await supabase.from('groups').delete().eq('project_id', projectId);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [Supabase] Error eliminando proyecto:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ [Supabase] Proyecto eliminado correctamente:', projectId);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error eliminando proyecto de Supabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

// ==========================================
// GRANULAR / ATOMIC OPERATIONS IN SUPABASE
// ==========================================

export async function saveGroupToSupabase(projectId: string, group: ActivityGroup): Promise<{ success: boolean; error?: string }> {
  try {
    const row = {
      group_id: group.id,
      project_id: projectId,
      group_code: group.code || '',
      group_name: group.name,
      color: group.color || '#3b82f6',
      show_box: group.showBox ?? true,
      type: group.type || 'activity',
    };
    const { error } = await supabase.from('groups').upsert([row], { onConflict: 'group_id' });
    if (error) {
      console.error('❌ [Supabase] Error upserting group:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ [Supabase] Grupo guardado exitosamente:', group.name, row);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveGroupToSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function removeGroupFromSupabase(projectId: string, groupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('groups').delete().eq('group_id', groupId).eq('project_id', projectId);
    if (error) {
      console.error('❌ [Supabase] Error deleting group:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ [Supabase] Grupo eliminado exitosamente:', groupId);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error en removeGroupFromSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function saveActivityToSupabase(projectId: string, activity: Activity): Promise<{ success: boolean; error?: string }> {
  try {
    const row = {
      activity_id: activity.id,
      project_id: projectId,
      group_id: activity.groupId || null,
      activity_code: activity.code || '',
      name: activity.name,
      color: activity.color || '#3b82f6',
      start_date: activity.startDate,
      has_end_date: !!activity.hasEndDate,
      end_date: activity.endDate || null,
      is_completed: !!activity.isCompleted,
      completed_date: activity.completedDate || null,
      schedule_type: activity.scheduleType || 'daily',
      active_days: activity.activeDays || [0, 1, 2, 3, 4, 5, 6],
      block_size: activity.blockSize ?? null,
      cluster_size: activity.clusterSize ?? null,
      day_value: activity.dayValue ?? null,
      sub_activities_json: activity.subActivities || [],
    };
    const { error } = await supabase.from('activities').upsert([row], { onConflict: 'activity_id' });
    if (error) {
      console.error('❌ [Supabase] Error upserting activity:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ [Supabase] Actividad guardada exitosamente:', activity.name, row);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveActivityToSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function removeActivityFromSupabase(projectId: string, activityId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('activities').delete().eq('activity_id', activityId).eq('project_id', projectId);
    if (error) {
      console.error('❌ [Supabase] Error deleting activity:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ [Supabase] Actividad eliminada exitosamente:', activityId);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error en removeActivityFromSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function saveResourceToSupabase(projectId: string, resource: Resource): Promise<{ success: boolean; error?: string }> {
  try {
    const row = {
      resource_id: resource.id,
      project_id: projectId,
      group_id: resource.groupId || null,
      resource_code: resource.code || '',
      name: resource.name,
      has_cost: !!resource.hasCost,
      cost: resource.cost ?? 0,
      has_duration_status: !!resource.hasDurationStatus,
      last_renewed_date: resource.lastRenewedDate || null,
      possession_status: resource.possessionStatus || 'se_tiene',
      availability_status: resource.availabilityStatus || 'disponible',
      consumption_type: resource.consumptionType || 'durable_seasonal',
      cycles_json: resource.cycles || [],
      notes: resource.notes || null,
      resource_nature: resource.resourceNature || 'expense',
      order_index: resource.order ?? 0,
    };
    const { error } = await supabase.from('resources').upsert([row], { onConflict: 'resource_id' });
    if (error) {
      console.error('❌ [Supabase] Error upserting resource:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ [Supabase] Recurso guardado exitosamente:', resource.name, row);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveResourceToSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function removeResourceFromSupabase(projectId: string, resourceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('resources').delete().eq('resource_id', resourceId).eq('project_id', projectId);
    if (error) {
      console.error('❌ [Supabase] Error deleting resource:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ [Supabase] Recurso eliminado exitosamente:', resourceId);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error en removeResourceFromSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function saveCompletionLogToSupabase(projectId: string, logKey: string, completed: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    if (completed) {
      const parsed = parseCompletionLogKey(logKey);
      const row = {
        log_key: logKey,
        project_id: projectId,
        activity_id: parsed.activityId,
        sub_activity_id: parsed.subActivityId,
        log_date: parsed.dateStr,
        completed: true,
      };
      const { error } = await supabase.from('completion_logs').upsert([row], { onConflict: 'log_key' });
      if (error) {
        console.error('❌ [Supabase] Error upserting completion_log:', error.message);
        return { success: false, error: error.message };
      }
      console.log('✅ [Supabase] Completion log guardado:', logKey);
      return { success: true };
    } else {
      const { error } = await supabase.from('completion_logs').delete().eq('log_key', logKey).eq('project_id', projectId);
      if (error) {
        console.error('❌ [Supabase] Error deleting completion_log:', error.message);
        return { success: false, error: error.message };
      }
      console.log('✅ [Supabase] Completion log desmarcado (eliminado):', logKey);
      return { success: true };
    }
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveCompletionLogToSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function saveResourceLogToSupabase(projectId: string, logKey: string, log: DailyResourceLog): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = parseResourceLogKey(logKey);
    const row = {
      log_key: logKey,
      project_id: projectId,
      resource_id: parsed.resourceId,
      log_date: parsed.dateStr,
      cost: log.cost ?? 0,
      bought: !!log.bought,
      renewed: !!log.renewed,
      state: log.state || null,
    };
    const { error } = await supabase.from('resource_logs').upsert([row], { onConflict: 'log_key' });
    if (error) {
      console.error('❌ [Supabase] Error upserting resource_log:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ [Supabase] Resource log guardado:', logKey, row);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveResourceLogToSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function removeResourceLogFromSupabase(projectId: string, logKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('resource_logs').delete().eq('log_key', logKey).eq('project_id', projectId);
    if (error) {
      console.error('❌ [Supabase] Error deleting resource_log:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ [Supabase] Resource log eliminado:', logKey);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error en removeResourceLogFromSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function saveIdeaToSupabase(projectId: string, idea: Idea): Promise<{ success: boolean; error?: string }> {
  try {
    const row = {
      idea_id: idea.id,
      project_id: projectId,
      title: idea.title,
      box_color: idea.boxColor || '#FFFFFF',
      content_html: idea.contentHtml || null,
      phrases_json: idea.phrases || [],
      order_index: idea.order ?? 0,
      collapsed: !!idea.collapsed,
    };
    const { error } = await supabase.from('ideas').upsert([row], { onConflict: 'idea_id' });
    if (error) {
      console.error('❌ [Supabase] Error upserting idea:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ [Supabase] Idea guardada exitosamente:', idea.title, row);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error en saveIdeaToSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

export async function removeIdeaFromSupabase(projectId: string, ideaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('ideas').delete().eq('idea_id', ideaId).eq('project_id', projectId);
    if (error) {
      console.error('❌ [Supabase] Error deleting idea:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ [Supabase] Idea eliminada exitosamente:', ideaId);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Error en removeIdeaFromSupabase:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
}

/**
 * Real-time subscription to any change across project tables.
 * When desktop or mobile updates any row for this project, the listener triggers onUpdate().
 */
export function subscribeToProjectRealtime(projectId: string, onUpdate: () => void) {
  console.log('📡 [Supabase] Suscribiendo canal en tiempo real para proyecto:', projectId);

  const channel = supabase
    .channel(`project_changes_${projectId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', filter: `project_id=eq.${projectId}` },
      (payload) => {
        console.log('⚡ [Supabase Realtime] Cambio detectado en tabla:', payload.table, payload.eventType);
        onUpdate();
      }
    )
    .subscribe((status) => {
      console.log(`📡 [Supabase Realtime] Estado de suscripción (${projectId}):`, status);
    });

  return () => {
    console.log('🔌 [Supabase Realtime] Desconectando canal para proyecto:', projectId);
    supabase.removeChannel(channel);
  };
}

// Helper key parsers
function parseCompletionLogKey(key: string): { activityId: string; subActivityId: string | null; dateStr: string } {
  const lastUnderscore = key.lastIndexOf('_');
  if (lastUnderscore === -1) {
    return { activityId: key, subActivityId: null, dateStr: new Date().toISOString().slice(0, 10) };
  }
  const dateStr = key.substring(lastUnderscore + 1);
  const remainder = key.substring(0, lastUnderscore);
  const secondUnderscore = remainder.lastIndexOf('_');
  if (secondUnderscore === -1) {
    return { activityId: remainder, subActivityId: null, dateStr };
  }
  const subOrMain = remainder.substring(secondUnderscore + 1);
  const activityId = remainder.substring(0, secondUnderscore);
  return {
    activityId,
    subActivityId: subOrMain === 'main' ? null : subOrMain,
    dateStr,
  };
}

function parseResourceLogKey(key: string): { resourceId: string; dateStr: string } {
  const lastUnderscore = key.lastIndexOf('_');
  if (lastUnderscore === -1) {
    return { resourceId: key, dateStr: new Date().toISOString().slice(0, 10) };
  }
  return {
    resourceId: key.substring(0, lastUnderscore),
    dateStr: key.substring(lastUnderscore + 1),
  };
}

/**
 * IMPORT TXT TO SUPABASE:
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

    const { error: projError } = await supabase.from('projects').upsert([
      {
        project_id: projectId,
        user_id: userId,
        project_name: projectName,
      },
    ], { onConflict: 'project_id' });

    if (projError) {
      console.warn('⚠️ [Supabase] Aviso al insertar en tabla projects:', projError.message);
    }

    await saveProjectArraysToSupabase(projectId, project);
    return { success: true, project };
  } catch (err: any) {
    console.error('❌ [Supabase] Error importando TXT a Supabase:', err);
    return { success: false, error: err?.message || 'Error al importar archivo TXT' };
  }
}

/**
 * EXPORT TXT FROM SUPABASE:
 */
export async function exportProjectFromSupabaseToTXT(projectId: string, fallbackProject?: Project): Promise<string> {
  try {
    const { data: projData } = await supabase
      .from('projects')
      .select('project_id, project_name')
      .eq('project_id', projectId)
      .maybeSingle();

    const projectName = projData?.project_name || fallbackProject?.name || 'Mi Proyecto';
    const projectFromSupabase = await loadFullProjectFromSupabase(projectId, projectName);

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

    return exportProjectToTXT(finalProject);
  } catch (err) {
    console.warn('⚠️ [Supabase] Error leyendo desde Supabase para exportar TXT, usando datos locales:', err);
    if (fallbackProject) {
      return exportProjectToTXT(fallbackProject);
    }
    throw err;
  }
}
