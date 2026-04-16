export function decodeXml(value = ""): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toNumber(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toBoolFlag(
  value: boolean | undefined,
  defaultValue: "Y" | "N",
): "Y" | "N" {
  if (value === undefined) return defaultValue;
  return value ? "Y" : "N";
}

export function findFirst(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeXml(text(match[1])) : undefined;
}

export function findAll(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi"))].map(
    (match) => decodeXml(text(match[1])),
  );
}

export function findAllLeafText(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, "gi"))].map((match) =>
    decodeXml(text(match[1])),
  );
}

export function findLast(xml: string, tag: string): string | undefined {
  const values = findAll(xml, tag);
  return values.length > 0 ? values.at(-1) : undefined;
}

export function findBlocks(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi"))].map(
    (match) => match[1],
  );
}

export function buildUrl(
  baseUrl: string,
  path: string,
  query: Record<string, unknown>,
): string {
  const url = new URL(`${baseUrl}/${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) url.searchParams.set(key, value.join("|"));
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}
