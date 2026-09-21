import {
  PREDEFINED_LABELS,
  STANDARD_STUDIO_LABELS,
  STANDARD_STUDIO_LABEL_IDS,
  isStandardStudioLabel,
  isCustomStudioLabel,
  CUSTOM_LABEL_ICON,
  CUSTOM_LABEL_BADGE_CLASS,
} from './studio.model';

describe('Studio Model Definitions', () => {
  it('should define exactly 9 standard studio labels', () => {
    expect(PREDEFINED_LABELS.length).toBe(9);
    expect(STANDARD_STUDIO_LABELS.length).toBe(9);
    expect(STANDARD_STUDIO_LABEL_IDS.size).toBe(9);
  });

  it('should identify standard labels accurately', () => {
    const standardKeys = [
      'walk',
      'idle',
      'run',
      'stairs',
      'stumble_recover',
      'fall_forward',
      'fall_backward',
      'fall_lateral',
      'fall_recovery',
    ];

    for (const key of standardKeys) {
      expect(isStandardStudioLabel(key)).toBeTrue();
      expect(isCustomStudioLabel(key)).toBeFalse();
    }
  });

  it('should identify custom/experimental labels accurately', () => {
    const customKeys = ['jump', 'sprint', 'dance', 'squat', 'custom_motion', 'limping'];

    for (const key of customKeys) {
      expect(isStandardStudioLabel(key)).toBeFalse();
      expect(isCustomStudioLabel(key)).toBeTrue();
    }
  });

  it('should handle empty or falsy strings for custom label checks', () => {
    expect(isStandardStudioLabel('')).toBeFalse();
    expect(isCustomStudioLabel('')).toBeFalse();
  });

  it('should export custom label icon and styling constants', () => {
    expect(CUSTOM_LABEL_ICON).toBe('🧪');
    expect(CUSTOM_LABEL_BADGE_CLASS).toContain('purple');
  });
});

