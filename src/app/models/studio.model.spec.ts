import {
  PREDEFINED_LABELS,
  STANDARD_STUDIO_LABELS,
  STANDARD_STUDIO_LABEL_IDS,
  isStandardStudioLabel,
  isCustomStudioLabel,
  isEdgeAiActivity,
  setEdgeAiActivities,
  CUSTOM_LABEL_ICON,
  CUSTOM_LABEL_BADGE_CLASS,
} from './studio.model';

describe('Studio Model Definitions', () => {
  it('should define exactly 18 standard studio labels', () => {
    expect(PREDEFINED_LABELS.length).toBe(18);
    expect(STANDARD_STUDIO_LABELS.length).toBe(18);
    expect(STANDARD_STUDIO_LABEL_IDS.size).toBe(18);
  });

  it('should identify standard labels accurately', () => {
    const standardKeys = [
      'walk',
      'idle',
      'sit_down',
      'stand_up',
      'lie_down',
      'lying_supine',
      'lying_prone',
      'lying_lateral',
      'run',
      'stairs',
      'stairs_up',
      'stairs_down',
      'jump',
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
    const customKeys = ['sprint', 'dance', 'squat', 'custom_motion', 'limping'];

    for (const key of customKeys) {
      expect(isStandardStudioLabel(key)).toBeFalse();
      expect(isCustomStudioLabel(key)).toBeTrue();
    }
  });

  it('should exclude stairs and stumble_recover from edge AI activities', () => {
    expect(isEdgeAiActivity('stairs')).toBeFalse();
    expect(isEdgeAiActivity('stumble_recover')).toBeFalse();
    expect(isEdgeAiActivity('stairs_up')).toBeTrue();
    expect(isEdgeAiActivity('stairs_down')).toBeTrue();
    expect(isEdgeAiActivity('fall_forward')).toBeTrue();
  });

  it('should dynamically update edge AI activities via setEdgeAiActivities', () => {
    setEdgeAiActivities(['custom_action', 'walk']);
    expect(isEdgeAiActivity('custom_action')).toBeTrue();
    expect(isEdgeAiActivity('walk')).toBeTrue();
    expect(isEdgeAiActivity('run')).toBeFalse();

    // Reset back
    setEdgeAiActivities([
      'idle', 'walk', 'run', 'stairs_up', 'stairs_down',
      'sit_down', 'stand_up', 'lie_down', 'lying_supine',
      'lying_prone', 'lying_lateral', 'jump', 'fall_forward',
      'fall_backward', 'fall_lateral', 'fall_recovery', 'fall_generic'
    ]);
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

