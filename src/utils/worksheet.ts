import { WorksheetData, ColumnDefinition } from '../types';

export function createEmptyWorksheet(title: string = 'Hoja de Trabajo 1', colCount: number = 10, rowCount: number = 40): WorksheetData {
  const columns: ColumnDefinition[] = Array.from({ length: colCount }, (_, i) => ({
    id: `C${i + 1}`,
    name: `Var_${i + 1}`,
    type: 'numeric',
    width: 110
  }));

  const rows = Array.from({ length: rowCount }, () => {
    const row: Record<string, string | number | null> = {};
    columns.forEach(col => {
      row[col.id] = null;
    });
    return row;
  });

  return {
    id: `ws_${Date.now()}`,
    title,
    columns,
    rows,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function parseCSV(csvText: string, title?: string): WorksheetData {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return createEmptyWorksheet(title || 'Datos Importados');
  }

  // Detect delimiter (, ; \t)
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';
  else if (semicolonCount > commaCount) delimiter = ';';

  // Parse row with quotes support
  const parseRow = (line: string): string[] => {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        tokens.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    tokens.push(current.trim());
    return tokens;
  };

  const headerTokens = parseRow(lines[0]);
  const hasHeader = headerTokens.some(t => isNaN(Number(t.replace(',', '.'))) && t !== '');

  let colNames: string[] = [];
  let dataLines = lines;

  if (hasHeader) {
    colNames = headerTokens;
    dataLines = lines.slice(1);
  } else {
    colNames = headerTokens.map((_, idx) => `Columna_${idx + 1}`);
  }

  const columns: ColumnDefinition[] = colNames.map((name, idx) => ({
    id: `C${idx + 1}`,
    name: name.replace(/^["']|["']$/g, '').trim() || `Var_${idx + 1}`,
    type: 'numeric',
    width: 120
  }));

  const rows: Record<string, string | number | null>[] = [];

  dataLines.forEach(line => {
    const tokens = parseRow(line);
    const rowObj: Record<string, string | number | null> = {};
    let hasAnyData = false;

    columns.forEach((col, idx) => {
      const val = tokens[idx];
      if (val !== undefined && val !== '') {
        const num = parseFloat(val.replace(',', '.'));
        if (!isNaN(num)) {
          rowObj[col.id] = num;
        } else {
          rowObj[col.id] = val;
          col.type = 'text'; // infer text type if non-numeric string found
        }
        hasAnyData = true;
      } else {
        rowObj[col.id] = null;
      }
    });

    if (hasAnyData) {
      rows.push(rowObj);
    }
  });

  return {
    id: `import_${Date.now()}`,
    title: title || 'Datos Importados',
    columns,
    rows: rows.length > 0 ? rows : createEmptyWorksheet().rows,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export const parseCSVToWorksheet = parseCSV;

export function exportWorksheetToCSV(ws: WorksheetData): void {
  const headers = ws.columns.map(c => `"${c.name.replace(/"/g, '""')}"`).join(',');
  const rowLines = ws.rows.map(row => {
    return ws.columns.map(c => {
      const val = row[c.id];
      if (val === null || val === undefined) return '';
      if (typeof val === 'number') return val.toString();
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [headers, ...rowLines].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${ws.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseClipboardData(text: string): { headers?: string[]; matrix: (string | number)[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { matrix: [] };

  const matrix = lines.map(line => {
    const tokens = line.split('\t');
    return tokens.map(t => {
      const trimmed = t.trim();
      const num = parseFloat(trimmed.replace(',', '.'));
      return !isNaN(num) && isFinite(num) ? num : trimmed;
    });
  });

  return { matrix };
}
