import { Project, Activity, ActivityGroup, SubActivity } from '../types';

/**
 * Generates a clean, comprehensive CSV export representation of the project.
 */
export function exportProjectToCSV(project: Project): string {
  const lines: string[] = [];

  // Metadata block
  lines.push('# EX56 PROJECT EXPORT');
  lines.push(`ProjectId,${escapeCSV(project.id)}`);
  lines.push(`ProjectName,${escapeCSV(project.name)}`);
  lines.push(`CreatedAt,${escapeCSV(project.createdAt)}`);
  lines.push(`UpdatedAt,${escapeCSV(project.updatedAt)}`);
  lines.push('');

  // Groups block
  lines.push('# GROUPS');
  lines.push('GroupId,GroupCode,GroupName,Color,ShowBox');
  for (const g of project.groups) {
    lines.push(`${escapeCSV(g.id)},${escapeCSV(g.code || '')},${escapeCSV(g.name)},${escapeCSV(g.color)},${g.showBox ? '1' : '0'}`);
  }
  lines.push('');

  // Activities block
  lines.push('# ACTIVITIES');
  lines.push('ActivityId,ActivityCode,GroupId,Name,Color,StartDate,HasEndDate,EndDate,IsCompleted,ScheduleType,ActiveDays,BlockSize,ClusterSize,DayValue,SubActivitiesJson');
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
      escapeCSV(a.scheduleType),
      escapeCSV(activeDaysStr),
      a.blockSize || '',
      a.clusterSize || '',
      a.dayValue || '',
      escapeCSV(subJson),
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

  return lines.join('\n');
}

/**
 * Parses an exported CSV string into a valid Project object.
 */
export function parseCSVToProject(csvText: string): Project {
  const lines = csvText.split(/\r?\n/);
  let mode: 'meta' | 'groups' | 'activities' | 'logs' = 'meta';

  let id = 'proj_' + Math.random().toString(36).substring(2, 9);
  let name = 'Proyecto Importado';
  let createdAt = new Date().toISOString();
  let updatedAt = new Date().toISOString();
  const groups: ActivityGroup[] = [];
  const activities: Activity[] = [];
  const completionLogs: Record<string, boolean> = {};

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
    } else if (line.startsWith('# COMPLETION_LOGS')) {
      mode = 'logs';
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
          groups.push({
            id: row[0],
            code: row[1] || undefined,
            name: row[2] || 'Grupo',
            color: row[3] || '#6366f1',
            showBox,
          });
        } else {
          const showBox = row[3] !== undefined ? row[3] === '1' : false;
          groups.push({
            id: row[0],
            name: row[1] || 'Grupo',
            color: row[2] || '#6366f1',
            showBox,
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
        const scheduleType = (row[8 + offset] as any) || 'daily';
        const activeDays = row[9 + offset] ? row[9 + offset].split(';').map(Number).filter((n) => !isNaN(n)) : [0, 1, 2, 3, 4, 5, 6];
        const blockSize = row[10 + offset] ? parseInt(row[10 + offset], 10) : undefined;
        
        // Find subActivities in last column if it looks like JSON array
        let subActivities: SubActivity[] = [];
        let clusterSize: number | undefined = undefined;
        let dayValue: number | undefined = undefined;

        const lastCol = row[row.length - 1];
        if (lastCol && lastCol.startsWith('[') && lastCol.endsWith(']')) {
          try {
            subActivities = JSON.parse(lastCol);
          } catch {
            subActivities = [];
          }
          // Check if intermediate cluster columns exist
          if (row.length >= 13 + offset) {
            clusterSize = row[11 + offset] ? parseInt(row[11 + offset], 10) : undefined;
          }
          if (row.length >= 14 + offset) {
            dayValue = row[12 + offset] ? parseInt(row[12 + offset], 10) : undefined;
          }
        } else if (row[11 + offset]) {
          try {
            subActivities = JSON.parse(row[11 + offset]);
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
          scheduleType,
          activeDays,
          blockSize,
          clusterSize,
          dayValue,
          subActivities,
        });
      }
    } else if (mode === 'logs') {
      if (row[0] === 'LogKey') continue; // header
      if (row.length >= 2 && row[1] === '1') {
        completionLogs[row[0]] = true;
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
    completionLogs,
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
  lines.push(`Fecha de Creación: ${project.createdAt}`);
  lines.push(`Última Actualización: ${project.updatedAt}`);
  lines.push(`Total de Actividades: ${project.activities.length}`);
  lines.push(`Total de Casillas Marcadas: ${completedCount}`);
  lines.push('');
  lines.push('----------------------------------------------------------------');
  lines.push('GRUPOS:');
  lines.push('----------------------------------------------------------------');
  if (project.groups.length === 0) {
    lines.push('(Sin grupos definidos)');
  } else {
    for (const g of project.groups) {
      lines.push(`- [${g.name}] (Color: ${g.color})`);
    }
  }
  lines.push('');
  lines.push('----------------------------------------------------------------');
  lines.push('ACTIVIDADES Y DETALLES:');
  lines.push('----------------------------------------------------------------');
  for (const act of project.activities) {
    const group = project.groups.find(g => g.id === act.groupId);
    const groupName = group ? `[${group.name}] ` : '';
    const endStr = act.hasEndDate && act.endDate ? `hasta ${act.endDate}` : 'Indefinido';
    lines.push(`* ${groupName}${act.name}`);
    lines.push(`  - Inicio: ${act.startDate} | Fin: ${endStr}`);
    lines.push(`  - Tipo: ${act.scheduleType} | Color: ${act.color}`);
    if (act.subActivities.length > 0) {
      lines.push(`  - Sub-actividades (${act.subActivities.length}):`);
      for (const sub of act.subActivities) {
        lines.push(`     • ${sub.name}`);
      }
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
      if (parsed && (parsed.activities || parsed.name)) {
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
      if (direct && (direct.activities !== undefined || direct.name !== undefined)) {
        return sanitizeProjectData(direct);
      }
    } catch (err) {
      console.warn('Direct JSON parse failed, trying CSV parser:', err);
    }
  }

  // 3. Try CSV parsing
  if (text.includes('# PLANMATRIX') || text.includes('ProjectId') || text.includes('# ACTIVITIES') || text.includes('ActivityId')) {
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
    throw new Error('No se pudo reconocer el formato del archivo. Asegúrate de importar un archivo .csv o .txt generado por PlanMatrix.');
  }
}

function sanitizeProjectData(data: any): Project {
  return {
    id: data.id || 'proj_' + Math.random().toString(36).substring(2, 9),
    name: data.name || 'Proyecto Importado',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    groups: Array.isArray(data.groups) ? data.groups.map((g: any) => ({
      id: g.id || 'grp_' + Math.random().toString(36).substring(2, 9),
      code: g.code,
      name: g.name || 'Grupo',
      color: g.color || '#6366f1',
      showBox: !!g.showBox,
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
      scheduleType: a.scheduleType || 'daily',
      activeDays: Array.isArray(a.activeDays) ? a.activeDays : [0, 1, 2, 3, 4, 5, 6],
      blockSize: a.blockSize,
      clusterSize: a.clusterSize,
      dayValue: a.dayValue,
      subActivities: Array.isArray(a.subActivities) ? a.subActivities.map((s: any, idx: number) => ({
        id: s.id || 'sub_' + Math.random().toString(36).substring(2, 9),
        code: s.code,
        name: s.name || `Sesión ${idx + 1}`,
        order: s.order || idx + 1,
      })) : [],
      notes: a.notes,
    })) : [],
    completionLogs: typeof data.completionLogs === 'object' && data.completionLogs !== null ? data.completionLogs : {},
  };
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
