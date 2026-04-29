import { pbkdf2, createCipheriv, createDecipheriv, randomBytes } from 'react-native-quick-crypto';

const VERSION = 'glico-bk-v1';
const ITER = 600_000;
const KEY_LEN = 32;
const IV_LEN = 12;
const SALT_LEN = 16;

// react-native-quick-crypto re-exports a Buffer class from @craftzdog/react-native-buffer
// that is structurally a Uint8Array. We keep types loose at the boundary and use Node's
// global Buffer for byte handling, since rn-quick-crypto consumes any Uint8Array-like input.
function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    pbkdf2(password, salt as unknown as Uint8Array, ITER, KEY_LEN, 'sha256', (err: Error | null, key?: Uint8Array) => {
      if (err || !key) reject(err ?? new Error('pbkdf2 returned no key'));
      else resolve(Buffer.from(key));
    });
  });
}

export async function encryptBackup(payload: unknown, password: string): Promise<string> {
  const salt = Buffer.from(randomBytes(SALT_LEN) as unknown as Uint8Array);
  const iv = Buffer.from(randomBytes(IV_LEN) as unknown as Uint8Array);
  const key = await deriveKey(password, salt);
  const cipher = createCipheriv('aes-256-gcm', key as unknown as Uint8Array, iv as unknown as Uint8Array);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const updateOut = Buffer.from(cipher.update(plaintext as unknown as Uint8Array) as unknown as Uint8Array);
  const finalOut = Buffer.from(cipher.final() as unknown as Uint8Array);
  const ciphertext = Buffer.concat([updateOut, finalOut]);
  const tag = Buffer.from(cipher.getAuthTag() as unknown as Uint8Array);
  return [
    VERSION,
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join('.');
}

export async function decryptBackup(blob: string, password: string): Promise<unknown> {
  const parts = blob.split('.');
  if (parts.length !== 5 || parts[0] !== VERSION) throw new Error('invalid backup format');
  const salt = Buffer.from(parts[1], 'base64');
  const iv = Buffer.from(parts[2], 'base64');
  const tag = Buffer.from(parts[3], 'base64');
  const ciphertext = Buffer.from(parts[4], 'base64');
  const key = await deriveKey(password, salt);
  const decipher = createDecipheriv('aes-256-gcm', key as unknown as Uint8Array, iv as unknown as Uint8Array);
  // setAuthTag expects @craftzdog/react-native-buffer Buffer; Node's Buffer is structurally
  // compatible at runtime but the type signature is narrow.
  (decipher as { setAuthTag: (t: unknown) => void }).setAuthTag(tag);
  const updateOut = Buffer.from(decipher.update(ciphertext as unknown as Uint8Array) as unknown as Uint8Array);
  const finalOut = Buffer.from(decipher.final() as unknown as Uint8Array);
  const plaintext = Buffer.concat([updateOut, finalOut]);
  return JSON.parse(plaintext.toString('utf8'));
}
