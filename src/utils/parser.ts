
export interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseSqlTable(input: string): ParsedData {
  const lines = input.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  // Try to detect format
  const isMySQL = lines[0].startsWith('+') || lines.some(l => l.includes('+-'));
  
  if (isMySQL) {
    return parseMySQL(lines);
  } else {
    // Default to PostgreSQL/Generic pipe-separated
    return parsePostgres(lines);
  }
}

function parseMySQL(lines: string[]): ParsedData {
  const headers: string[] = [];
  const rows: Record<string, string>[] = [];
  
  // Filter out border lines
  const contentLines = lines.filter(line => line.startsWith('|'));
  
  if (contentLines.length === 0) return { headers: [], rows: [] };

  // First content line is header
  const rawHeaders = contentLines[0]
    .split('|')
    .map(h => h.trim())
    .filter(h => h !== '');
  
  headers.push(...rawHeaders);

  // Subsequent lines are data
  for (let i = 1; i < contentLines.length; i++) {
    const values = contentLines[i]
      .split('|')
      .map(v => v.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parsePostgres(lines: string[]): ParsedData {
  const headers: string[] = [];
  const rows: Record<string, string>[] = [];

  // Find the separator line (e.g., ----+----+----)
  const separatorIdx = lines.findIndex(l => l.includes('-+-') || (l.includes('---') && !l.includes('|')));
  
  if (separatorIdx === -1) {
    // Try simple pipe separation if no separator line found
    const firstLine = lines[0].split('|').map(h => h.trim()).filter(h => h !== '');
    if (firstLine.length > 1) {
      headers.push(...firstLine);
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '' || lines[i].startsWith('(')) continue;
        const values = lines[i].split('|').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
      return { headers, rows };
    }
    return { headers: [], rows: [] };
  }

  // Header is the line before separator
  const rawHeaders = lines[separatorIdx - 1]
    .split('|')
    .map(h => h.trim())
    .filter(h => h !== '');
  
  headers.push(...rawHeaders);

  // Data starts after separator
  for (let i = separatorIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('(')) continue; // Skip empty or summary lines like "(2 rows)"
    
    const values = lines[i]
      .split('|')
      .map(v => v.trim());
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

export function convertToCSV(data: ParsedData): string {
  if (data.headers.length === 0) return '';
  const headerRow = data.headers.join(',');
  const bodyRows = data.rows.map(row => 
    data.headers.map(h => {
      const val = row[h];
      return val.includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  return [headerRow, ...bodyRows].join('\n');
}

export function convertToJSON(data: ParsedData): string {
  return JSON.stringify(data.rows, null, 2);
}

export function convertToMarkdown(data: ParsedData): string {
  if (data.headers.length === 0) return '';
  const headerRow = `| ${data.headers.join(' | ')} |`;
  const separatorRow = `| ${data.headers.map(() => '---').join(' | ')} |`;
  const bodyRows = data.rows.map(row => 
    `| ${data.headers.map(h => row[h]).join(' | ')} |`
  );
  return [headerRow, separatorRow, ...bodyRows].join('\n');
}

export function convertToSQL(data: ParsedData, tableName: string = 'converted_table'): string {
  if (data.headers.length === 0) return '';
  const columns = data.headers.join(', ');
  const insertRows = data.rows.map(row => {
    const values = data.headers.map(h => {
      const val = row[h];
      return isNaN(Number(val)) ? `'${val.replace(/'/g, "''")}'` : val;
    }).join(', ');
    return `INSERT INTO ${tableName} (${columns}) VALUES (${values});`;
  });
  return insertRows.join('\n');
}
