import {
  levelToIntensity,
  intensityToLevel,
  HAPTIC_MIN_INTENSITY,
  HAPTIC_MAX_INTENSITY,
} from './haptic.utils';

describe('haptic.utils', () => {
  describe('levelToIntensity', () => {
    it('should map level 1 to 128 (min backend intensity)', () => {
      expect(levelToIntensity(1)).toBe(HAPTIC_MIN_INTENSITY);
    });

    it('should map level 10 to 255 (max backend intensity)', () => {
      expect(levelToIntensity(10)).toBe(HAPTIC_MAX_INTENSITY);
    });

    it('should map intermediate levels correctly and monotonically', () => {
      let previous = 0;
      for (let level = 1; level <= 10; level++) {
        const intensity = levelToIntensity(level);
        expect(intensity).toBeGreaterThanOrEqual(128);
        expect(intensity).toBeLessThanOrEqual(255);
        if (level > 1) {
          expect(intensity).toBeGreaterThan(previous);
        }
        previous = intensity;
      }
    });

    it('should clamp values outside 1..10 range', () => {
      expect(levelToIntensity(0)).toBe(128);
      expect(levelToIntensity(-5)).toBe(128);
      expect(levelToIntensity(15)).toBe(255);
    });
  });

  describe('intensityToLevel', () => {
    it('should map 128 to level 1', () => {
      expect(intensityToLevel(128)).toBe(1);
    });

    it('should map 255 to level 10', () => {
      expect(intensityToLevel(255)).toBe(10);
    });

    it('should clamp values below 128 to level 1', () => {
      expect(intensityToLevel(0)).toBe(1);
      expect(intensityToLevel(100)).toBe(1);
    });

    it('should clamp values above 255 to level 10', () => {
      expect(intensityToLevel(300)).toBe(10);
    });

    it('should be reversible for all 10 discrete levels', () => {
      for (let level = 1; level <= 10; level++) {
        const intensity = levelToIntensity(level);
        expect(intensityToLevel(intensity)).toBe(level);
      }
    });
  });
});
