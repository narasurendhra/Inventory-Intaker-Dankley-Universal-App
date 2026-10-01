const { isDankleyEmail, resolveUserProfile, generateToken, verifyToken } = require('../src/lib/auth');
const PosAdapterFactory = require('../src/lib/posAdapters/PosAdapterFactory');

describe('Dankley Multi-Tenant Auth & Location Routing Suite', () => {
  describe('Domain Verification Gate (@dankley.com)', () => {
    it('strictly accepts verified @dankley.com email addresses', () => {
      expect(isDankleyEmail('queens@dankley.com')).toBe(true);
      expect(isDankleyEmail('developer@dankley.com')).toBe(true);
      expect(isDankleyEmail('DUTCHIE.DEV@DANKLEY.COM')).toBe(true);
      expect(isDankleyEmail('alex.smith@dankley.com')).toBe(true);
    });

    it('strictly rejects non-dankley email domains', () => {
      expect(isDankleyEmail('user@gmail.com')).toBe(false);
      expect(isDankleyEmail('competitor@dispensary.com')).toBe(false);
      expect(isDankleyEmail('intruder@yahoo.com')).toBe(false);
      expect(isDankleyEmail('')).toBe(false);
      expect(isDankleyEmail(null)).toBe(false);
    });

    it('throws access denied exception when non-dankley email attempts resolution', () => {
      expect(() => resolveUserProfile('hacker@external.org')).toThrow(/Access Denied/);
    });
  });

  describe('Location & POS Engine Allocation', () => {
    it('allocates Queens location to Alleaves POS', () => {
      const profile = resolveUserProfile('queens@dankley.com');
      expect(profile.locationId).toBe('queens');
      expect(profile.posType).toBe('alleaves');

      const adapter = PosAdapterFactory.getAdapter(profile.locationId);
      expect(adapter.getType()).toBe('alleaves');
      expect(adapter.getName()).toBe('Alleaves POS');
    });

    it('allocates Dutchie location to Dutchie POS', () => {
      const profile = resolveUserProfile('dutchie@dankley.com');
      expect(profile.locationId).toBe('manhattan_dutchie');
      expect(profile.posType).toBe('dutchie');

      const adapter = PosAdapterFactory.getAdapter(profile.locationId);
      expect(adapter.getType()).toBe('dutchie');
      expect(adapter.getName()).toBe('Dutchie POS');
    });

    it('allocates Blaze migration team to BLAZE POS', () => {
      const profile = resolveUserProfile('blaze.dev@dankley.com');
      expect(profile.locationId).toBe('queens_blaze');
      expect(profile.posType).toBe('blaze');

      const adapter = PosAdapterFactory.getAdapter(profile.locationId);
      expect(adapter.getType()).toBe('blaze');
      expect(adapter.getName()).toBe('BLAZE POS');
    });

    it('allocates new unlisted @dankley.com team members to default sandbox', () => {
      const profile = resolveUserProfile('newhire@dankley.com');
      expect(profile.name).toBe('Newhire');
      expect(profile.locationId).toBe('sandbox');
      expect(profile.posType).toBe('mock');

      const adapter = PosAdapterFactory.getAdapter(profile.locationId);
      expect(adapter.getType()).toBe('mock');
    });
  });

  describe('JWT Session Lifecycle', () => {
    it('signs and verifies valid operator tokens', () => {
      const profile = resolveUserProfile('developer@dankley.com');
      const token = generateToken(profile);
      expect(typeof token).toBe('string');

      const verified = verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified.sub).toBe('developer@dankley.com');
      expect(verified.locationId).toBe('manhattan_dutchie');
    });

    it('fails verification on tampered or corrupted tokens', () => {
      expect(verifyToken('invalid.corrupted.token')).toBeNull();
    });
  });
});
