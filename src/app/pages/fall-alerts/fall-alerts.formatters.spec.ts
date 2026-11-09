import { describe, it, expect } from 'vitest';
import { TranslationService } from '../../core/services/translation.service';
import { FallAlertSummary, FallAlertDetail } from '../../models/api.models';
import {
  formatFallAlertResolution,
  formatFallAlertStateLabel,
  formatFallTypeLabel,
  getFallAlertStateBadgeClass,
  getGoogleMapsUrl,
  getNotificationStatusBadgeClass,
  getSubjectPseudonym,
} from './fall-alerts.formatters';

describe('fall-alerts.formatters', () => {
  const translationMock = {
    translate: (key: string, params?: Record<string, string | number>) => {
      if (params) {
        let res = `[${key}]`;
        for (const [k, v] of Object.entries(params)) {
          res += ` ${k}=${v}`;
        }
        return res;
      }
      return `[${key}]`;
    },
  } as unknown as TranslationService;

  describe('formatFallTypeLabel', () => {
    it('returns translated fall_generic label', () => {
      expect(formatFallTypeLabel('fall_generic', translationMock)).toBe('[fall_alerts.fall_generic]');
    });

    it('returns predefined or raw label for standard labels', () => {
      const res = formatFallTypeLabel('stairs_up', translationMock);
      expect(res).toBeDefined();
    });

    it('returns raw label when unknown', () => {
      expect(formatFallTypeLabel('unknown_custom_label', translationMock)).toBe('unknown_custom_label');
    });
  });

  describe('formatFallAlertStateLabel', () => {
    it('returns translated state key', () => {
      expect(formatFallAlertStateLabel('ACKNOWLEDGED', translationMock)).toBe('[fall_alerts.state_ACKNOWLEDGED]');
      expect(formatFallAlertStateLabel('PENDING', translationMock)).toBe('[fall_alerts.state_PENDING]');
    });
  });

  describe('getFallAlertStateBadgeClass', () => {
    it('returns emerald classes for ACKNOWLEDGED', () => {
      expect(getFallAlertStateBadgeClass('ACKNOWLEDGED')).toContain('emerald');
    });

    it('returns amber classes for PENDING and ESCALATING', () => {
      expect(getFallAlertStateBadgeClass('PENDING')).toContain('amber');
      expect(getFallAlertStateBadgeClass('ESCALATING')).toContain('amber');
    });

    it('returns red classes for EXHAUSTED', () => {
      expect(getFallAlertStateBadgeClass('EXHAUSTED')).toContain('red');
    });

    it('returns slate classes for CANCELLED and SUPPRESSED', () => {
      expect(getFallAlertStateBadgeClass('CANCELLED')).toContain('slate');
      expect(getFallAlertStateBadgeClass('SUPPRESSED')).toContain('slate');
      expect(getFallAlertStateBadgeClass('UNKNOWN')).toContain('slate');
    });
  });

  describe('getNotificationStatusBadgeClass', () => {
    it('returns corresponding color classes for notification statuses', () => {
      expect(getNotificationStatusBadgeClass('ACKNOWLEDGED')).toContain('emerald');
      expect(getNotificationStatusBadgeClass('PENDING_SMS')).toContain('amber');
      expect(getNotificationStatusBadgeClass('SENT')).toContain('blue');
      expect(getNotificationStatusBadgeClass('FAILED')).toContain('red');
      expect(getNotificationStatusBadgeClass('UNKNOWN')).toContain('red');
    });
  });

  describe('formatFallAlertResolution', () => {
    it('formats acknowledgment by name for regular users without pseudonymization', () => {
      const alert: FallAlertSummary = {
        id: 1,
        device_id: 'HK-1',
        event_type: 'fall_generic',
        confidence: 0.95,
        state: 'ACKNOWLEDGED',
        created_at: '2026-11-09T10:00:00Z',
        acknowledged_by: {
          first_name: 'Alice',
          last_name: 'Smith',
        },
      };

      const res = formatFallAlertResolution(alert, translationMock, false);
      expect(res).toBe('[fall_alerts.ack_by_label] name=Alice Smith');
    });

    it('formats acknowledgment by rank index for clinicians or pseudonymized alerts', () => {
      const alert: FallAlertSummary = {
        id: 2,
        device_id: 'HK-1',
        event_type: 'fall_generic',
        confidence: 0.95,
        state: 'ACKNOWLEDGED',
        created_at: '2026-11-09T10:00:00Z',
        is_pseudonymized: true,
        acknowledged_by: {
          rank: 2,
        },
      };

      const res = formatFallAlertResolution(alert, translationMock, true);
      expect(res).toBe('[fall_alerts.ack_by_index_label] index=2');
    });

    it('extracts rank from notifications list if acknowledged_by rank is null', () => {
      const detail: FallAlertDetail = {
        id: 3,
        device_id: 'HK-1',
        event_type: 'fall_generic',
        confidence: 0.95,
        state: 'ACKNOWLEDGED',
        created_at: '2026-11-09T10:00:00Z',
        acknowledged_by: {},
        notifications: [
          { rank: 3, status: 'ACKNOWLEDGED' } as any,
        ],
      };

      const res = formatFallAlertResolution(detail, translationMock, true);
      expect(res).toBe('[fall_alerts.ack_by_index_label] index=3');
    });

    it('formats cancel reasons', () => {
      const alertUserCancel: FallAlertSummary = {
        id: 4,
        device_id: 'HK-1',
        event_type: 'fall_generic',
        confidence: 0.95,
        state: 'CANCELLED',
        created_at: '2026-11-09T10:00:00Z',
        cancel_reason: 'user_cancel',
      };
      expect(formatFallAlertResolution(alertUserCancel, translationMock, false)).toBe('[fall_alerts.cancel_user_cancel]');

      const alertRecovery: FallAlertSummary = {
        id: 5,
        device_id: 'HK-1',
        event_type: 'fall_generic',
        confidence: 0.95,
        state: 'CANCELLED',
        created_at: '2026-11-09T10:00:00Z',
        cancel_reason: 'fall_recovery',
      };
      expect(formatFallAlertResolution(alertRecovery, translationMock, false)).toBe('[fall_alerts.cancel_fall_recovery]');
    });

    it('returns dash fallback when no resolution info is present', () => {
      const alert: FallAlertSummary = {
        id: 6,
        device_id: 'HK-1',
        event_type: 'fall_generic',
        confidence: 0.95,
        state: 'PENDING',
        created_at: '2026-11-09T10:00:00Z',
      };
      expect(formatFallAlertResolution(alert, translationMock, false)).toBe('—');
    });
  });

  describe('getSubjectPseudonym', () => {
    it('returns pseudonym when available', () => {
      expect(getSubjectPseudonym({ user_pseudonym: 'User#123' } as any)).toBe('User#123');
      expect(getSubjectPseudonym({ subject_pseudonym: 'Subject#456' } as any)).toBe('Subject#456');
      expect(getSubjectPseudonym({ user_display_name: 'John Doe' } as any)).toBe('John Doe');
    });

    it('returns dash for null or undefined', () => {
      expect(getSubjectPseudonym(null)).toBe('—');
      expect(getSubjectPseudonym(undefined)).toBe('—');
      expect(getSubjectPseudonym({} as any)).toBe('—');
    });
  });

  describe('getGoogleMapsUrl', () => {
    it('formats correct Google Maps query URL', () => {
      expect(getGoogleMapsUrl(48.8566, 2.3522)).toBe('https://www.google.com/maps?q=48.8566,2.3522');
    });
  });
});
