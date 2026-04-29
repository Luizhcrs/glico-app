import { encryptBackup, decryptBackup } from '@/crypto/backup';

describe('backup roundtrip', () => {
  it('encrypts and decrypts JSON payload', async () => {
    const payload = { measurements: [{ id: 1, valueMgdl: 142 }], settings: { displayName: 'Maria' } };
    const password = 'correct horse battery staple';
    const blob = await encryptBackup(payload, password);
    expect(typeof blob).toBe('string');
    const restored = await decryptBackup(blob, password);
    expect(restored).toEqual(payload);
  });
  it('rejects wrong password', async () => {
    const blob = await encryptBackup({ x: 1 }, 'pass1');
    await expect(decryptBackup(blob, 'pass2')).rejects.toThrow();
  });
});
