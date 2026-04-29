jest.mock('react-native-quick-crypto', () => {
  const c = require('crypto');
  return {
    pbkdf2: c.pbkdf2,
    createCipheriv: c.createCipheriv,
    createDecipheriv: c.createDecipheriv,
    randomBytes: c.randomBytes,
  };
});
