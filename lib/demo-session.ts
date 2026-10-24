const encoder = new TextEncoder();

export const DEMO_COOKIE = "lp_demo_session";

export interface DemoSessionPayload {
  id: string;
  email: string;
  role: "customer" | "admin";
  exp: number;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function key() {
  const secret = process.env.DEMO_SESSION_SECRET || "leaf-and-pot-local-demo-secret";
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signDemoSession(payload: DemoSessionPayload) {
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await key(), encoder.encode(body));
  return `${body}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyDemoSession(token: string | undefined | null): Promise<DemoSessionPayload | null> {
  if (!token) return null;
  try {
    const [body, signature] = token.split(".");
    if (!body || !signature) return null;
    const valid = await crypto.subtle.verify(
      "HMAC",
      await key(),
      base64UrlToBytes(signature) as unknown as BufferSource,
      encoder.encode(body),
    );
    if (!valid) return null;
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as DemoSessionPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
