const GROUP_SIZE = 50;

function findColumns(header) {
  const normalized = header.map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase());

  const find = (...names) => {
    for (const name of names) {
      const idx = normalized.findIndex(h => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const meaning2 = normalized.findIndex(h => h === '뜻2' || h.endsWith('뜻2'));
  const meaning = normalized.findIndex(h =>
    h === '뜻' || (h.includes('뜻') && h !== '뜻2' && !h.endsWith('뜻2'))
  );

  const group = find('그룹', 'group');

  return {
    group: group !== -1 ? group : -1,
    number: find('번호', 'number', 'no') !== -1 ? find('번호', 'number', 'no') : 0,
    hanja: find('한자') !== -1 ? find('한자') : 0,
    hangul: find('한글') !== -1 ? find('한글') : 1,
    meaning: meaning !== -1 ? meaning : 2,
    meaning2: meaning2 !== -1 ? meaning2 : 3,
  };
}

function computeGroupRange(indexOneBased) {
  const start = Math.floor((indexOneBased - 1) / GROUP_SIZE) * GROUP_SIZE + 1;
  const end = start + GROUP_SIZE - 1;
  return `${start}~${end}`;
}

function finalizeItems(rawItems) {
  return rawItems.map((item, i) => {
    const num = i + 1;
    const sheetGroup = String(item.group ?? '').trim();
    return {
      ...item,
      id: String(item.id || num),
      groupRange: sheetGroup || computeGroupRange(num),
    };
  });
}

function parseGvizResponse(text) {
  if (/accounts\.google\.com|Sign in/i.test(text)) {
    throw new Error('private');
  }

  const match = text.match(/setResponse\(([\s\S]+)\)\s*;?\s*$/);
  if (!match) throw new Error('parse');

  const data = JSON.parse(match[1]);
  let headers = data.table.cols.map(col => String(col.label || '').trim());
  let rows = (data.table.rows || []).map(row =>
    row.c.map(cell => {
      if (!cell) return '';
      return String(cell.f ?? cell.v ?? '');
    })
  );

  const labelsEmpty = headers.every((h) => !h);
  if (labelsEmpty && rows.length > 0) {
    const first = rows[0].map((v) => String(v).trim());
    if (first[0] === '한자' || first.includes('한자')) {
      headers = first;
      rows = rows.slice(1);
    }
  }

  return { headers, rows };
}

function resolveColumnMap(headers) {
  const colMap = findColumns(headers);
  const hasHanja = headers.some(h => h.includes('한자'));

  if (hasHanja) return colMap;

  return { group: -1, number: -1, hanja: 0, hangul: 1, meaning: 2, meaning2: 3 };
}

function readGroup(cols, colMap) {
  if (colMap.group < 0) return '';
  return String(cols[colMap.group] || '').trim();
}

function isHeaderRow(hanja) {
  const v = String(hanja || '').trim();
  return v === '한자' || v === 'hanja';
}

function rowsToItems(headers, rows) {
  const colMap = resolveColumnMap(headers);

  const raw = rows
    .map((cols, i) => {
      const hanja = String(cols[colMap.hanja] || '').trim();
      if (!hanja || isHeaderRow(hanja)) return null;

      return {
        group: readGroup(cols, colMap),
        id: colMap.number >= 0 ? String(cols[colMap.number] || i + 1).trim() : String(i + 1),
        hanja,
        hangul: String(cols[colMap.hangul] || '').trim(),
        meaning: String(cols[colMap.meaning] || '').trim(),
        meaning2: String(cols[colMap.meaning2] || '').trim(),
      };
    })
    .filter(Boolean);

  return finalizeItems(raw);
}

function objectsToItems(objects) {
  const raw = objects
    .map((row, i) => {
      const values = Object.values(row);
      if (values.every(v => !String(v).trim())) return null;

      return {
        group: String(row['그룹'] ?? row.group ?? '').trim(),
        id: String(row['번호'] ?? row.number ?? i + 1),
        hanja: String(row['한자'] ?? '').trim(),
        hangul: String(row['한글'] ?? '').trim(),
        meaning: String(row['뜻'] ?? '').trim(),
        meaning2: String(row['뜻2'] ?? '').trim(),
      };
    })
    .filter(Boolean)
    .filter((item) => item.hanja);

  return finalizeItems(raw);
}

async function fetchWithTimeout(url, options = {}, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromAppsScript(url) {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error('fetch');

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('empty');

  const items = objectsToItems(data);
  if (items.length === 0) throw new Error('empty');
  return items;
}

async function fetchFromPublicSheet(sheetId, gid) {
  const jsonUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
  const res = await fetchWithTimeout(jsonUrl);
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
