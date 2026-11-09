import { TranslationService } from '../../core/services/translation.service';
import { StudioSessionSummary } from '../../models/studio-history.model';
import {
  CUSTOM_LABEL_BADGE_CLASS,
  CUSTOM_LABEL_ICON,
} from '../../models/studio.model';
import {
  getStudioAuthorDisplayName,
  getStudioLabelBadgeClass,
  getStudioLabelDisplayName,
  getStudioLabelIcon,
  getStudioUserPseudonymOrEmail,
} from './studio-session.formatters';

describe('studio-session.formatters', () => {
  let translationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    translationService = jasmine.createSpyObj<TranslationService>('TranslationService', ['translate']);
  });

  describe('getStudioLabelBadgeClass', () => {
    it('returns custom badge class for non-standard labels', () => {
      expect(getStudioLabelBadgeClass('breakdance')).toBe(CUSTOM_LABEL_BADGE_CLASS);
      expect(getStudioLabelBadgeClass('moonwalk')).toContain('purple');
    });

    it('returns slate classes for idle', () => {
      const cls = getStudioLabelBadgeClass('idle');
      expect(cls).toContain('bg-slate-100');
      expect(cls).toContain('text-slate-800');
    });

    it('returns red classes for fall labels', () => {
      expect(getStudioLabelBadgeClass('fall_forward')).toContain('bg-red-100');
      expect(getStudioLabelBadgeClass('fall_backward')).toContain('text-red-800');
    });

    it('returns emerald classes for walk and run', () => {
      expect(getStudioLabelBadgeClass('walk')).toContain('bg-emerald-100');
      expect(getStudioLabelBadgeClass('run')).toContain('text-emerald-800');
    });

    it('returns amber classes for stairs and stumble_recover', () => {
      expect(getStudioLabelBadgeClass('stairs')).toContain('bg-amber-100');
      expect(getStudioLabelBadgeClass('stumble_recover')).toContain('text-amber-800');
    });

    it('returns indigo classes as fallback for other standard labels', () => {
      expect(getStudioLabelBadgeClass('jump')).toContain('bg-indigo-100');
    });
  });

  describe('getStudioLabelDisplayName', () => {
    it('returns empty string for empty input', () => {
      expect(getStudioLabelDisplayName('')).toBe('');
    });

    it('returns translated name when translation is found', () => {
      translationService.translate.and.returnValue('Marche');
      expect(getStudioLabelDisplayName('walk', translationService)).toBe('Marche');
      expect(translationService.translate).toHaveBeenCalledWith('studio.labels.walk');
    });

    it('falls back to raw label if key is not translated', () => {
      translationService.translate.and.returnValue('studio.labels.unknown_std');
      expect(getStudioLabelDisplayName('unknown_std', translationService)).toBe('unknown_std');
    });

    it('returns custom label directly without translation', () => {
      expect(getStudioLabelDisplayName('custom_test')).toBe('custom_test');
      expect(translationService.translate).not.toHaveBeenCalled();
    });
  });

  describe('getStudioLabelIcon', () => {
    it('returns icon from predefined labels', () => {
      expect(getStudioLabelIcon('walk')).toBe('🚶');
      expect(getStudioLabelIcon('idle')).toBe('⏸️');
      expect(getStudioLabelIcon('run')).toBe('🏃');
    });

    it('returns custom fallback icon for unknown label', () => {
      expect(getStudioLabelIcon('unknown_activity')).toBe(CUSTOM_LABEL_ICON);
    });

    it('returns alarm emoji for unlisted fall labels', () => {
      expect(getStudioLabelIcon('unknown_fall')).toBe('🚨');
    });
  });

  describe('getStudioUserPseudonymOrEmail', () => {
    const baseSummary: StudioSessionSummary = {
      uuid: '11111111-2222-3333-4444-555555555555',
      device_id: 'HK-01',
      label: 'walk',
      sample_count: 100,
      duration_sec: 5.0,
      recorded_at_utc: '2026-11-09T12:00:00Z',
      is_validated: true,
      data_file_path: 's3://bucket/path.csv',
    };

    it('prefers user_email when present', () => {
      const summary: StudioSessionSummary = {
        ...baseSummary,
        user_email: 'runner@healthkicks.local',
        author_name: 'Dr. John',
        subject_pseudonym: 'P-99',
      };
      expect(getStudioUserPseudonymOrEmail(summary)).toBe('runner@healthkicks.local');
    });

    it('falls back to author_name if user_email is absent', () => {
      const summary: StudioSessionSummary = {
        ...baseSummary,
        author_name: 'Dr. John',
        subject_pseudonym: 'P-99',
      };
      expect(getStudioUserPseudonymOrEmail(summary)).toBe('Dr. John');
    });

    it('falls back to patient pseudonym if email and author are absent', () => {
      const summary: StudioSessionSummary = {
        ...baseSummary,
        subject_pseudonym: 'P-99',
      };
      expect(getStudioUserPseudonymOrEmail(summary)).toBe('Patient P-99');
    });

    it('returns dash if no author info is present', () => {
      expect(getStudioUserPseudonymOrEmail(baseSummary)).toBe('—');
    });
  });

  describe('getStudioAuthorDisplayName', () => {
    const baseSummary: StudioSessionSummary = {
      uuid: '11111111-2222-3333-4444-555555555555',
      device_id: 'HK-01',
      label: 'walk',
      sample_count: 100,
      duration_sec: 5.0,
      recorded_at_utc: '2026-11-09T12:00:00Z',
      is_validated: true,
      data_file_path: 's3://bucket/path.csv',
    };

    it('returns pseudonymized name when session is pseudonymized', () => {
      const summary: StudioSessionSummary = {
        ...baseSummary,
        user_email: 'secret@hospital.local',
        author_name: 'Dr. House',
        is_pseudonymized: true,
      };
      expect(getStudioAuthorDisplayName(summary)).toBe('Dr. House');
    });

    it('returns Patient pseudonym when session is pseudonymized and author_name is absent', () => {
      const summary: StudioSessionSummary = {
        ...baseSummary,
        user_email: 'secret@hospital.local',
        subject_pseudonym: 'P-42',
        is_pseudonymized: true,
      };
      expect(getStudioAuthorDisplayName(summary)).toBe('Patient P-42');
    });

    it('delegates to getStudioUserPseudonymOrEmail when not pseudonymized', () => {
      const summary: StudioSessionSummary = {
        ...baseSummary,
        user_email: 'runner@healthkicks.local',
        author_name: 'Dr. John',
        is_pseudonymized: false,
      };
      expect(getStudioAuthorDisplayName(summary)).toBe('runner@healthkicks.local');
    });
  });
});
