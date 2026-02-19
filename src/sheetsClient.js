import { google } from "googleapis";

const HEADER = [
  "date_jst",
  "phone",
  "usage_mb",
  "period_start",
  "period_end",
  "plan_name",
  "fetched_at_jst",
  "status",
  "error_message"
];

function makeSheetsClient(serviceAccount) {
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return google.sheets({ version: "v4", auth });
}

async function ensureHeader(sheets, sheetId, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!1:1`
  });

  const firstRow = res.data.values?.[0] ?? [];
  const same =
    firstRow.length === HEADER.length &&
    firstRow.every((cell, i) => cell === HEADER[i]);

  if (same) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:I1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADER] }
  });
}

async function loadKeyRowMap(sheets, sheetId, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A2:B`
  });

  const map = new Map();
  const rows = res.data.values ?? [];
  for (let i = 0; i < rows.length; i += 1) {
    const [dateJst, phone] = rows[i];
    if (!dateJst || !phone) {
      continue;
    }
    map.set(`${dateJst}::${phone}`, i + 2);
  }
  return map;
}

export async function upsertUsageRows(config, records, meta) {
  const sheets = makeSheetsClient(config.serviceAccount);
  await ensureHeader(sheets, config.sheetId, config.sheetName);
  const keyRowMap = await loadKeyRowMap(sheets, config.sheetId, config.sheetName);

  for (const record of records) {
    const row = [
      meta.dateJst,
      record.phone,
      String(record.usageMb),
      record.periodStart,
      record.periodEnd,
      record.planName,
      meta.fetchedAtJst,
      record.status,
      record.errorMessage
    ];

    const key = `${meta.dateJst}::${record.phone}`;
    const existingRowNumber = keyRowMap.get(key);

    if (existingRowNumber) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.sheetId,
        range: `${config.sheetName}!A${existingRowNumber}:I${existingRowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [row] }
      });
      continue;
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.sheetId,
      range: `${config.sheetName}!A:I`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] }
    });
  }
}
