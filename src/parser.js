import { toIsoDateFromJp } from "./time.js";

function normalize(text) {
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
}

export function parseUsageMb(pageText) {
  const text = normalize(pageText);
  const sectionMatch = text.match(/当月利用データ量([\s\S]{0,200})/);
  if (!sectionMatch) {
    return null;
  }

  const mbMatch = sectionMatch[1].match(/([0-9][0-9,]*)\s*MB/i);
  if (!mbMatch) {
    return null;
  }

  return Number(mbMatch[1].replace(/,/g, ""));
}

export function parsePeriod(pageText) {
  const text = normalize(pageText);
  const m = text.match(
    /(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日\s*[〜～~\-]\s*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/
  );
  if (!m) {
    return { start: "", end: "" };
  }

  return {
    start: toIsoDateFromJp(m[1], m[2], m[3]),
    end: toIsoDateFromJp(m[4], m[5], m[6])
  };
}

export function parsePlanName(pageText) {
  const text = normalize(pageText);
  const section = text.match(/サービス名([\s\S]{0,120})/);
  if (!section) {
    return "";
  }

  const lines = section[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 0 ? lines[0] : "";
}
