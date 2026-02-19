const required = [
  "HIS_MOBILE_ID",
  "HIS_MOBILE_PASSWORD",
  "GOOGLE_SERVICE_ACCOUNT_JSON",
  "GOOGLE_SHEET_ID"
];

function parseJsonSecret(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Set the full JSON in GitHub Secrets."
    );
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key."
    );
  }

  // GitHub Secrets often store private_key with escaped newlines (\\n).
  parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");

  if (!parsed.private_key.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON.private_key looks invalid. Recreate and re-set the service account JSON secret."
    );
  }

  return parsed;
}

export function loadConfig() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    hisId: process.env.HIS_MOBILE_ID,
    hisPassword: process.env.HIS_MOBILE_PASSWORD,
    hisLoginUrl:
      process.env.HIS_MOBILE_LOGIN_URL ??
      "https://his.mvno.ne.jp/hisso/signon/login.do?josso_back_to=https://his.mvno.ne.jp/checkout/josso_security_check&josso_partnerapp_host=his.mvno.ne.jp&josso_partnerapp_ctx=/checkout",
    headless: process.env.HEADLESS !== "false",
    timeoutMs: Number(process.env.BROWSER_TIMEOUT_MS ?? "45000"),
    sheetId: process.env.GOOGLE_SHEET_ID,
    sheetName: process.env.GOOGLE_SHEET_NAME ?? "raw_usage",
    serviceAccount: parseJsonSecret(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    selectors: {
      loginId: process.env.SELECTOR_LOGIN_ID ?? 'input[name="login_id"]',
      loginPassword:
        process.env.SELECTOR_LOGIN_PASSWORD ?? 'input[name="password"]',
      loginSubmit:
        process.env.SELECTOR_LOGIN_SUBMIT ?? 'button[type="submit"], input[type="submit"]',
      simSelect: process.env.SELECTOR_SIM_SELECT ?? "select"
    }
  };
}
