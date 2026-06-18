/**
 * @license
 * All Rights Reserved.
 */

// NOTE: This is meant to deter casual save editing, not provide real secrecy or crytographicsecurity.
// Any key shipped to the client can be extracted by a determined attacker.

const SAVE_CODE_PREFIX = "SMM1:";
const KEY_MATERIAL = "milkshake-mania::savecode::v1::pepper";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array<ArrayBufferLike>): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  const materialHash = await crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(KEY_MATERIAL),
  );
  return crypto.subtle.importKey(
    "raw",
    materialHash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encodeSaveCode(state: unknown): Promise<string> {
  const key = await getKey();
  const iv: Uint8Array<ArrayBuffer> = crypto.getRandomValues(
    new Uint8Array(12),
  ) as Uint8Array<ArrayBuffer>;
  const plaintext = textEncoder.encode(JSON.stringify(state));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );

  const payload = {
    v: 1,
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(ciphertext)),
  };

  return (
    SAVE_CODE_PREFIX +
    bytesToBase64(textEncoder.encode(JSON.stringify(payload)))
  );
}
export async function decodeSaveCode(code: string): Promise<unknown> {
  const trimmed: string = code.trim();

  if (!trimmed.startsWith(SAVE_CODE_PREFIX)) {
    throw new Error("Invalid save code prefix");
  }

  const b64: string = trimmed.slice(SAVE_CODE_PREFIX.length);

  const payloadText: string = textDecoder.decode(base64ToBytes(b64));

  const payload: {
    v: number;
    iv: string;
    ct: string;
  } = JSON.parse(payloadText);

  if (!payload || payload.v !== 1 || !payload.iv || !payload.ct) {
    throw new Error("Invalid save code payload");
  }

  const key: CryptoKey = await getKey();

  const iv: Uint8Array<ArrayBuffer> = base64ToBytes(payload.iv);

  const ciphertext: Uint8Array<ArrayBuffer> = base64ToBytes(payload.ct);

  const plaintext: ArrayBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );

  return JSON.parse(textDecoder.decode(new Uint8Array(plaintext)));
}
