function parseGvizResponse(text) {
  if (/accounts\.google\.com|Sign in/i.test(text)) {
    throw new Error('private');
  }

  const match = text.match(/setResponse\(([\s\S]+)\)\s*;?\s*$/);
  if (!match) throw new Error('parse');

  const data = JSON.parse(match[1]);
  const headers = data.table.cols.map(col => String(col.label || '').trim());
  const rows = (data.table.rows || []).map(row =>
    row.c.map(cell => {
      if (!cell) return '';
      return String(cell.f ?? cell.v ?? '');
    })
  );

  return { headers, rows };
}

function resolveColumnMap(headers) {
  const colMap = findColumns(headers);
  const hasHanja = headers.some(h => h.includes('한자'));

  if (hasHanja) return colMap;

  return { number: 0, hanja: 1, hangul: 2, meaning: 3, meaning2: 4 };
}

function rowsToItems(headers, rows) {
  const colMap = resolveColumnMap(headers);

  return rows
    .map((cols, i) => {
      const hanja = String(cols[colMap.hanja] || '').trim();
      if (!hanja) return null;

      return {
        id: String(cols[colMap.number] || i + 1).trim(),
        hanja,
        hangul: String(cols[colMap.hangul] || '').trim(),
        meaning: String(cols[colMap.meaning] || '').trim(),
        meaning2: String(cols[colMap.meaning2] || '').trim(),
      };
    })
    .filter(Boolean);
}

function objectsToItems(objects) {
  return objects
    .map((row, i) => {
      const values = Object.values(row);
      if (values.every(v => !String(v).trim())) return null;

      return {
        id: String(row['번호'] ?? row.number ?? i + 1),
        hanja: String(row['한자'] ?? ''),
        hangul: String(row['한글'] ?? ''),
        meaning: String(row['뜻'] ?? ''),
        meaning2: String(row['뜻2'] ?? ''),
      };
    })
    .filter(Boolean);
}

async function fetchFromAppsScript(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch');

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('empty');

  const items = objectsToItems(data);
  if (items.length === 0) throw new Error('empty');
  return items;
}

async function fetchFromPublicSheet(sheetId, gid) {
  const jsonUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
  const res = await fetch(jsonUrl);
  if (!res.ok) throw new Error('fetch');

  const text = await res.text();
  const { headers, rows } = parseGvizResponse(text);
  const items = rowsToItems(headers, rows);
  if (items.length === 0) throw new Error('empty');
  return items;
}

async function fetchFromGoogleSheet(config) {
  if (config.APPS_SCRIPT_URL) {
    return { items: await fetchFromAppsScript(config.APPS_SCRIPT_URL), source: 'apps-script' };
  }
  return {
    items: await fetchFromPublicSheet(config.SHEET_ID, config.GID),
    source: 'public-sheet',
  };
}
