import { Project, Activity, ActivityGroup, SubActivity, Resource, DailyResourceLog, Idea, IdeaPhrase } from '../types';

/**
 * Generates raw JSON export string representing the entire project losslessly,
 * including ideas and timestamp of download.
 */
export function exportProjectToJSON(project: Project): string {
  const downloadDateIso = new Date().toISOString();
  const downloadDateFormatted = new Date().toLocaleString('es-PE');
  const exportPayload = {
    ...project,
    lastDownloadedAt: downloadDateIso,
    fechaDescarga: downloadDateFormatted,
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Generates a clean, comprehensive CSV export representation of the project,
 * including all active activities, completed past activities, groups, resources, ideas, and logs.
 */
export function exportProjectToCSV(project: Project): string {
  const lines: string[] = [];

  // Metadata block
  lines.push('# EX56 PROJECT EXPORT');
  lines.push(`ProjectId,${escapeCSV(project.id)}`);
  lines.push(`ProjectName,${escapeCSV(project.name)}`);
  lines.push(`CreatedAt,${escapeCSV(project.createdAt)}`);
  lines.push(`UpdatedAt,${escapeCSV(project.updatedAt)}`);
  lines.push(`FechaDescarga,${escapeCSV(new Date().toLocaleString('es-PE'))}`);
  lines.push(`LastDownloadedAt,${escapeCSV(new Date().toISOString())}`);
  lines.push('');

  // Groups block
  lines.push('# GROUPS');
  lines.push('GroupId,GroupCode,GroupName,Color,ShowBox,Type');
  for (const g of project.groups) {
    lines.push([
      escapeCSV(g.id),
      escapeCSV(g.code || ''),
      escapeCSV(g.name),
      escapeCSV(g.color),
      g.showBox ? '1' : '0',
      escapeCSV(g.type || 'activity'),
    ].join(','));
  }
  lines.push('');

  // Activities block (includes active and past completed activities)
  lines.push('# ACTIVITIES');
  lines.push('ActivityId,ActivityCode,GroupId,Name,Color,StartDate,HasEndDate,EndDate,IsCompleted,CompletedDate,ScheduleType,ActiveDays,BlockSize,ClusterSize,DayValue,SubActivitiesJson');
  for (const a of project.activities) {
    const subJson = JSON.stringify(a.subActivities);
    const activeDaysStr = a.activeDays.join(';');
    lines.push([
      escapeCSV(a.id),
      escapeCSV(a.code || ''),
      escapeCSV(a.groupId || ''),
      escapeCSV(a.name),
      escapeCSV(a.color),
      escapeCSV(a.startDate),
      a.hasEndDate ? '1' : '0',
      escapeCSV(a.endDate || ''),
      a.isCompleted ? '1' : '0',
      escapeCSV(a.completedDate || ''),
      escapeCSV(a.scheduleType),
      escapeCSV(activeDaysStr),
      a.blockSize !== undefined ? a.blockSize.toString() : '',
      a.clusterSize !== undefined ? a.clusterSize.toString() : '',
      a.dayValue !== undefined ? a.dayValue.toString() : '',
      escapeCSV(subJson),
    ].join(','));
  }
  lines.push('');

  // Resources block
  lines.push('# RESOURCES');
  lines.push('ResourceId,ResourceCode,GroupId,Name,HasCost,Cost,HasDurationStatus,LastRenewedDate,PossessionStatus,AvailabilityStatus,ConsumptionType,CyclesJson,Notes,ResourceNature,Order');
  for (const r of (project.resources || [])) {
    const cyclesJson = JSON.stringify(r.cycles || []);
    lines.push([
      escapeCSV(r.id),
      escapeCSV(r.code || ''),
      escapeCSV(r.groupId || ''),
      escapeCSV(r.name),
      r.hasCost ? '1' : '0',
      r.cost !== undefined ? r.cost.toString() : '0',
      r.hasDurationStatus ? '1' : '0',
      escapeCSV(r.lastRenewedDate || ''),
      escapeCSV(r.possessionStatus || 'se_tiene'),
      escapeCSV(r.availabilityStatus || 'disponible'),
      escapeCSV(r.consumptionType || 'durable_seasonal'),
      escapeCSV(cyclesJson),
      escapeCSV(r.notes || ''),
      escapeCSV(r.resourceNature || 'expense'),
      r.order !== undefined ? r.order.toString() : '',
    ].join(','));
  }
  lines.push('');

  // Daily Completion Logs block
  lines.push('# COMPLETION_LOGS');
  lines.push('LogKey,Completed');
  for (const [key, val] of Object.entries(project.completionLogs)) {
    if (val) {
      lines.push(`${escapeCSV(key)},1`);
    }
  }
  lines.push('');

  // Daily Resource Logs block
  lines.push('# RESOURCE_LOGS');
  lines.push('LogKey,Cost,Bought,Renewed,State');
  for (const [key, val] of Object.entries(project.resourceLogs || {})) {
    lines.push([
      escapeCSV(key),
      val.cost !== undefined ? val.cost.toString() : '0',
      val.bought ? '1' : '0',
      val.renewed ? '1' : '0',
      escapeCSV(val.state || ''),
    ].join(','));
  }
  lines.push('');

  // Ideas block
  lines.push('# IDEAS');
  lines.push('IdeaId,Title,BoxColor,Order,Collapsed,CreatedAt,UpdatedAt,PhrasesJson,ContentHtml');
  for (const idea of (project.ideas || [])) {
    const phrasesJson = JSON.stringify(idea.phrases || []);
    lines.push([
      escapeCSV(idea.id),
      escapeCSV(idea.title),
      escapeCSV(idea.boxColor || '#FFFFFF'),
      idea.order !== undefined ? idea.order.toString() : '0',
      idea.collapsed ? '1' : '0',
      escapeCSV(idea.createdAt || ''),
      escapeCSV(idea.updatedAt || ''),
      escapeCSV(phrasesJson),
      escapeCSV(idea.contentHtml || ''),
    ].join(','));
  }

  return lines.join('\n');
}

/**
 * Parses an exported CSV string into a valid Project object.
 */
export function parseCSVToProject(csvText: string): Project {
  const lines = csvText.split(/\r?\n/);
  let mode: 'meta' | 'groups' | 'activities' | 'resources' | 'logs' | 'resource_logs' | 'ideas' = 'meta';

  let id = 'proj_' + Math.random().toString(36).substring(2, 9);
  let name = 'Proyecto Importado (Ex56)';
  let createdAt = new Date().toISOString();
  let updatedAt = new Date().toISOString();
  let lastDownloadedAt: string | undefined = undefined;
  const groups: ActivityGroup[] = [];
  const activities: Activity[] = [];
  const resources: Resource[] = [];
  const ideas: Idea[] = [];
  const completionLogs: Record<string, boolean> = {};
  const resourceLogs: Record<string, DailyResourceLog> = {};

  let groupsHasCode = false;
  let activitiesHasCode = false;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('# GROUPS')) {
      mode = 'groups';
      continue;
    } else if (line.startsWith('# ACTIVITIES')) {
      mode = 'activities';
      continue;
    } else if (line.startsWith('# RESOURCES')) {
      mode = 'resources';
      continue;
    } else if (line.startsWith('# COMPLETION_LOGS')) {
      mode = 'logs';
      continue;
    } else if (line.startsWith('# RESOURCE_LOGS')) {
      mode = 'resource_logs';
      continue;
    } else if (line.startsWith('# IDEAS')) {
      mode = 'ideas';
      continue;
    } else if (line.startsWith('#')) {
      continue;
    }

    const row = parseCSVRow(line);

    if (mode === 'meta') {
      if (row[0] === 'ProjectId' && row[1]) id = row[1];
      if (row[0] === 'ProjectName' && row[1]) name = row[1];
      if (row[0] === 'CreatedAt' && row[1]) createdAt = row[1];
      if (row[0] === 'UpdatedAt' && row[1]) updatedAt = row[1];
    } else if (mode === 'groups') {
      if (row[0] === 'GroupId') {
        groupsHasCode = row.includes('GroupCode');
        continue;
      }
      if (row.length >= 2) {
        if (groupsHasCode && row.length >= 3) {
          const showBox = row[4] !== undefined ? row[4] === '1' : false;
          const groupType = (row[5] === 'resource' ? 'resource' : 'activity') as any;
          groups.push({
            id: row[0],
            code: row[1] || undefined,
            name: row[2] || 'Grupo',
            color: row[3] || '#6366f1',
            showBox,
            type: groupType,
          });
        } else {
          const showBox = row[3] !== undefined ? row[3] === '1' : false;
          groups.push({
            id: row[0],
            name: row[1] || 'Grupo',
            color: row[2] || '#6366f1',
            showBox,
            type: 'activity',
          });
        }
      }
    } else if (mode === 'activities') {
      if (row[0] === 'ActivityId') {
        activitiesHasCode = row.includes('ActivityCode');
        continue;
      }
      if (row.length >= 5) {
        const actId = row[0];
        let code: string | undefined = undefined;
        let offset = 0;

        if (activitiesHasCode) {
          code = row[1] || undefined;
          offset = 1;
        }

        const groupId = row[1 + offset] || null;
        const actName = row[2 + offset] || 'Actividad';
        const color = row[3 + offset] || '#3b82f6';
        const startDate = row[4 + offset] || new Date().toISOString().split('T')[0];
        const hasEndDate = row[5 + offset] === '1';
        const endDate = row[6 + offset] ? row[6 + offset] : null;
        const isCompleted = row[7 + offset] === '1';

        // Check if CompletedDate is present in column 8 + offset
        let completedDate: string | null = null;
        let nextIdx = 8 + offset;
        if (row.length > 13 + offset) {
          completedDate = row[nextIdx] ? row[nextIdx] : null;
          nextIdx++;
        }

        const scheduleType = (row[nextIdx] as any) || 'daily';
        nextIdx++;
        const activeDays = row[nextIdx] ? row[nextIdx].split(';').map(Number).filter((n) => !isNaN(n)) : [0, 1, 2, 3, 4, 5, 6];
        nextIdx++;
        const blockSize = row[nextIdx] ? parseInt(row[nextIdx], 10) : undefined;
        nextIdx++;
        const clusterSize = row[nextIdx] ? parseInt(row[nextIdx], 10) : undefined;
        nextIdx++;
        const dayValue = row[nextIdx] ? parseInt(row[nextIdx], 10) : undefined;
        
        let subActivities: SubActivity[] = [];
        const lastCol = row[row.length - 1];
        if (lastCol && lastCol.startsWith('[') && lastCol.endsWith(']')) {
          try {
            subActivities = JSON.parse(lastCol);
          } catch {
            subActivities = [];
          }
        }

        activities.push({
          id: actId,
          code,
          groupId,
          name: actName,
          color,
          startDate,
          hasEndDate,
          endDate,
          isCompleted,
          completedDate,
          scheduleType,
          activeDays,
          blockSize,
          clusterSize,
          dayValue,
          subActivities,
        });
      }
    } else if (mode === 'resources') {
      if (row[0] === 'ResourceId') continue; // header
      if (row.length >= 4) {
        let cycles: any[] = [];
        if (row[11] && row[11].startsWith('[') && row[11].endsWith(']')) {
          try {
            cycles = JSON.parse(row[11]);
          } catch {
            cycles = [];
          }
        }

        resources.push({
          id: row[0],
          code: row[1] || undefined,
          groupId: row[2] || null,
          name: row[3] || 'Recurso',
          hasCost: row[4] !== '0',
          cost: parseFloat(row[5]) || 0,
          hasDurationStatus: row[6] === '1',
          lastRenewedDate: row[7] || null,
          possessionStatus: (row[8] as any) || 'se_tiene',
          availabilityStatus: (row[9] as any) || 'disponible',
          consumptionType: (row[10] as any) || 'durable_seasonal',
          cycles,
          notes: row[12] || undefined,
          resourceNature: (row[13] as any) === 'income' ? 'income' : 'expense',
          order: row[14] ? parseInt(row[14], 10) : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } else if (mode === 'logs') {
      if (row[0] === 'LogKey') continue; // header
      if (row.length >= 2 && row[1] === '1') {
        completionLogs[row[0]] = true;
      }
    } else if (mode === 'resource_logs') {
      if (row[0] === 'LogKey') continue; // header
      resourceLogs[row[0]] = {
        cost: parseFloat(row[1]) || 0,
        bought: row[2] === '1',
        renewed: row[3] === '1',
        state: (row[4] as any) || undefined,
      };
    } else if (mode === 'ideas') {
      if (row[0] === 'IdeaId') continue; // header
      if (row.length >= 2) {
        let phrases: IdeaPhrase[] = [];
        try {
          if (row[7]) phrases = JSON.parse(row[7]);
        } catch {
          phrases = [];
        }
        ideas.push({
          id: row[0],
          title: row[1] || 'Idea',
          boxColor: row[2] || '#FFFFFF',
          order: row[3] ? parseInt(row[3], 10) : ideas.length,
          collapsed: row[4] === '1',
          createdAt: row[5] || new Date().toISOString(),
          updatedAt: row[6] || new Date().toISOString(),
          phrases,
          contentHtml: row[8] || undefined,
        });
      }
    }
  }

  return {
    id,
    name,
    createdAt,
    updatedAt,
    groups,
    activities,
    resources,
    ideas,
    completionLogs,
    resourceLogs,
    lastDownloadedAt,
  };
}

/**
 * Generates an informative TXT export file with human-readable summary
 * followed by an embedded data block for guaranteed round-trip import.
 */
export function exportProjectToTXT(project: Project): string {
  const completedCount = Object.keys(project.completionLogs).filter(k => project.completionLogs[k]).length;
  const lines: string[] = [];

  lines.push('================================================================');
  lines.push(`EX56 - REPORTE DE PROYECTO: ${project.name.toUpperCase()}`);
  lines.push('================================================================');
  lines.push(`ID del Proyecto: ${project.id}`);
  lines.push(`Fecha de Descarga: ${new Date().toLocaleString('es-PE')} (${new Date().toISOString()})`);
  lines.push(`Fecha de Creación: ${project.createdAt}`);
  lines.push(`Última Actualización: ${project.updatedAt}`);
  lines.push(`Total de Actividades: ${project.activities.length}`);
  lines.push(`Total de Recursos: ${(project.resources || []).length}`);
  lines.push(`Total de Cajas de Ideas: ${(project.ideas || []).length}`);
  lines.push(`Total de Casillas Marcadas: ${completedCount}`);
  lines.push('');

  lines.push('----------------------------------------------------------------');
  lines.push('GRUPOS:');
  lines.push('----------------------------------------------------------------');
  if (project.groups.length === 0) {
    lines.push('(Sin grupos definidos)');
  } else {
    for (const g of project.groups) {
      lines.push(`- [${g.code || 'GRP'}] ${g.name} (Tipo: ${g.type || 'activity'}, Color: ${g.color})`);
    }
  }
  lines.push('');

  lines.push('----------------------------------------------------------------');
  lines.push('ACTIVIDADES VIGENTES:');
  lines.push('----------------------------------------------------------------');
  const activeActs = project.activities.filter(a => !a.isCompleted);
  for (const act of activeActs) {
    const group = project.groups.find(g => g.id === act.groupId);
    const groupName = group ? `[${group.name}] ` : '';
    const endStr = act.hasEndDate && act.endDate ? `hasta ${act.endDate}` : 'Indefinido';
    lines.push(`* ${groupName}${act.name} (Inicio: ${act.startDate} | Fin: ${endStr})`);
  }
  lines.push('');

  lines.push('----------------------------------------------------------------');
  lines.push('HISTORIAL DE ACTIVIDADES PASADAS (FINALIZADAS):');
  lines.push('----------------------------------------------------------------');
  const finishedActs = project.activities.filter(a => a.isCompleted);
  if (finishedActs.length === 0) {
    lines.push('(No hay actividades finalizadas en el historial)');
  } else {
    for (const act of finishedActs) {
      lines.push(`✓ [FINALIZADA] ${act.name} (Finalizada el: ${act.completedDate || act.endDate || 'Registrada'})`);
    }
  }
  lines.push('');

  lines.push('----------------------------------------------------------------');
  lines.push('RECURSOS REGISTRADOS (EX56):');
  lines.push('----------------------------------------------------------------');
  if (!project.resources || project.resources.length === 0) {
    lines.push('(Sin recursos registrados)');
  } else {
    for (const r of project.resources) {
      const durationStr = r.hasDurationStatus ? 'Con estado de duración' : 'Gasto recurrente/frecuente';
      const costStr = r.hasCost ? `S/. ${r.cost.toFixed(2)}` : 'Sin precio';
      lines.push(`• [${r.code || 'REC'}] ${r.name} - ${costStr} (${durationStr}, Estado: ${r.availabilityStatus || 'disponible'})`);
    }
  }
  lines.push('');

  lines.push('----------------------------------------------------------------');
  lines.push('IDEAS Y NOTAS REGISTRADAS (EX56):');
  lines.push('----------------------------------------------------------------');
  if (!project.ideas || project.ideas.length === 0) {
    lines.push('(Sin ideas ni notas registradas)');
  } else {
    for (const idea of project.ideas) {
      lines.push(`■ [IDEA] ${idea.title} (Color de fondo: ${idea.boxColor || '#FFFFFF'}, Orden: ${idea.order})`);
      if (idea.phrases && idea.phrases.length > 0) {
        for (const phrase of idea.phrases) {
          const sizeStr = phrase.fontSize ? `[Tamaño: ${phrase.fontSize}]` : '';
          const weightStr = phrase.fontWeight ? `[Grosor: ${phrase.fontWeight}]` : '';
          const colorStr = phrase.color ? `[Color: ${phrase.color}]` : '';
          lines.push(`   • ${phrase.text} ${sizeStr} ${weightStr} ${colorStr}`);
        }
      } else {
        lines.push('   (Caja sin frases)');
      }
      lines.push('');
    }
  }
  lines.push('');

  lines.push('================================================================');
  lines.push('DATOS COMPLETOS DEL SISTEMA PARA RE-IMPORTAR (NO MODIFICAR ABAJO):');
  lines.push('=== PLANMATRIX_RAW_DATA_START ===');
  lines.push(JSON.stringify(project, null, 2));
  lines.push('=== PLANMATRIX_RAW_DATA_END ===');

  return lines.join('\n');
}

/**
 * Parses an exported TXT, JSON, or CSV string into a Project object.
 * Auto-detects format with multiple fallbacks.
 */
export function importProjectFromAnyFormat(rawText: string): Project {
  const text = rawText.trim();
  if (!text) {
    throw new Error('El contenido proporcionado está vacío.');
  }

  // 1. Try finding PlanMatrix embedded data marker in TXT
  const startMarker = '=== PLANMATRIX_RAW_DATA_START ===';
  const endMarker = '=== PLANMATRIX_RAW_DATA_END ===';
  if (text.includes(startMarker) && text.includes(endMarker)) {
    try {
      const jsonStr = text.split(startMarker)[1].split(endMarker)[0].trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed && (parsed.activities || parsed.name || parsed.resources)) {
        return sanitizeProjectData(parsed);
      }
    } catch (err) {
      console.warn('Failed parsing embedded TXT JSON, falling back:', err);
    }
  }

  // 2. Try direct JSON parse
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const direct = JSON.parse(text);
      if (direct && (direct.activities !== undefined || direct.name !== undefined || direct.resources !== undefined)) {
        return sanitizeProjectData(direct);
      }
    } catch (err) {
      console.warn('Direct JSON parse failed, trying CSV parser:', err);
    }
  }

  // 3. Try CSV parsing
  if (text.includes('# EX56') || text.includes('# PLANMATRIX') || text.includes('ProjectId') || text.includes('# ACTIVITIES') || text.includes('ActivityId') || text.includes('# RESOURCES')) {
    try {
      return parseCSVToProject(text);
    } catch (err: any) {
      throw new Error('Error al interpretar el archivo CSV: ' + err.message);
    }
  }

  // 4. Last attempt: try CSV anyway
  try {
    return parseCSVToProject(text);
  } catch {
    throw new Error('No se pudo reconocer el formato del archivo. Asegúrate de importar un archivo .json, .csv o .txt generado por Ex56.');
  }
}

function sanitizeProjectData(data: any): Project {
  return {
    id: data.id || 'proj_' + Math.random().toString(36).substring(2, 9),
    name: data.name || 'Proyecto Importado (Ex56)',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    groups: Array.isArray(data.groups) ? data.groups.map((g: any) => ({
      id: g.id || 'grp_' + Math.random().toString(36).substring(2, 9),
      code: g.code,
      name: g.name || 'Grupo',
      color: g.color || '#6366f1',
      showBox: !!g.showBox,
      type: g.type || 'activity',
    })) : [],
    activities: Array.isArray(data.activities) ? data.activities.map((a: any) => ({
      id: a.id || 'act_' + Math.random().toString(36).substring(2, 9),
      code: a.code,
      groupId: a.groupId || null,
      name: a.name || 'Actividad',
      color: a.color || '#3b82f6',
      startDate: a.startDate || new Date().toISOString().split('T')[0],
      hasEndDate: !!a.hasEndDate,
      endDate: a.endDate || null,
      isCompleted: !!a.isCompleted,
      completedDate: a.completedDate || null,
      scheduleType: a.scheduleType || 'daily',
      activeDays: Array.isArray(a.activeDays) ? a.activeDays : [0, 1, 2, 3, 4, 5, 6],
      blockSize: a.blockSize,
      clusterSize: a.clusterSize,
      dayValue: a.dayValue,
      clusterBlocks: Array.isArray(a.clusterBlocks) ? a.clusterBlocks : undefined,
      subActivities: Array.isArray(a.subActivities) ? a.subActivities.map((s: any, idx: number) => ({
        id: s.id || 'sub_' + Math.random().toString(36).substring(2, 9),
        code: s.code,
        name: s.name || `Sesión ${idx + 1}`,
        order: s.order || idx + 1,
      })) : [],
      notes: a.notes,
    })) : [],
    resources: Array.isArray(data.resources) ? data.resources.map((r: any) => ({
      id: r.id || 'res_' + Math.random().toString(36).substring(2, 9),
      code: r.code,
      groupId: r.groupId || null,
      name: r.name || 'Recurso',
      hasCost: r.hasCost !== undefined ? !!r.hasCost : true,
      cost: Number(r.cost) || 0,
      hasDurationStatus: r.hasDurationStatus !== undefined ? !!r.hasDurationStatus : false,
      lastRenewedDate: r.lastRenewedDate || null,
      possessionStatus: r.possessionStatus || 'se_tiene',
      availabilityStatus: r.availabilityStatus || 'disponible',
      consumptionType: r.consumptionType || 'durable_seasonal',
      cycles: Array.isArray(r.cycles) ? r.cycles : [],
      notes: r.notes,
      resourceNature: r.resourceNature === 'income' ? 'income' : 'expense',
      order: r.order !== undefined ? Number(r.order) : undefined,
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.updatedAt || new Date().toISOString(),
    })) : [],
    completionLogs: typeof data.completionLogs === 'object' && data.completionLogs !== null ? data.completionLogs : {},
    resourceLogs: typeof data.resourceLogs === 'object' && data.resourceLogs !== null ? data.resourceLogs : {},
    dailyMissionsCustomIds: Array.isArray(data.dailyMissionsCustomIds) ? data.dailyMissionsCustomIds : undefined,
    ideas: Array.isArray(data.ideas) ? data.ideas.map((item: any, idx: number) => ({
      id: item.id || 'idea_' + Math.random().toString(36).substring(2, 9),
      title: item.title || 'Idea',
      boxColor: item.boxColor || '#FFFFFF',
      contentHtml: typeof item.contentHtml === 'string' ? item.contentHtml : undefined,
      order: item.order !== undefined ? Number(item.order) : idx,
      collapsed: item.collapsed !== undefined ? !!item.collapsed : false,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      phrases: Array.isArray(item.phrases) ? item.phrases.map((p: any) => ({
        id: p.id || 'phr_' + Math.random().toString(36).substring(2, 9),
        text: typeof p.text === 'string' ? p.text : '',
        fontSize: p.fontSize || 'base',
        color: p.color || '#0F172A',
        fontWeight: p.fontWeight || 'normal',
      })) : [],
    })) : [],
    lastDownloadedAt: typeof data.lastDownloadedAt === 'string' ? data.lastDownloadedAt : (data.FechaDescarga || undefined),
  };
}

/**
 * Generates an export filename with exact date and time (YYYY-MM-DD_HH-mm-ss)
 * to easily identify the most recent backup.
 */
export function getExportFilename(extension: 'json' | 'csv' | 'txt', prefix: string = 'Ex56'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${prefix}_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.${extension}`;
}

/**
 * Helper to trigger browser file download.
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function parseCSVRow(text: string): string[] {
  const result: string[] = [];
  let curr = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          curr += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        curr += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(curr);
        curr = '';
      } else {
        curr += char;
      }
    }
  }
  result.push(curr);
  return result;
}
