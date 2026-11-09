import { getDeviceDisplayName, isDeviceOnline } from './device.formatters';

describe('device.formatters', () => {
  describe('getDeviceDisplayName', () => {
    it('returns empty string when device is null or undefined', () => {
      expect(getDeviceDisplayName(null)).toBe('');
      expect(getDeviceDisplayName(undefined)).toBe('');
    });

    it('returns device name when available', () => {
      expect(getDeviceDisplayName({ device_id: 'HK-1', name: 'Chaussure Droite' })).toBe('Chaussure Droite');
    });

    it('falls back to device_id when name is null, undefined, or empty whitespace', () => {
      expect(getDeviceDisplayName({ device_id: 'HK-1', name: null })).toBe('HK-1');
      expect(getDeviceDisplayName({ device_id: 'HK-2', name: undefined })).toBe('HK-2');
      expect(getDeviceDisplayName({ device_id: 'HK-3', name: '   ' })).toBe('HK-3');
    });
  });

  describe('isDeviceOnline', () => {
    it('returns false when device is null or undefined', () => {
      expect(isDeviceOnline(null)).toBe(false);
      expect(isDeviceOnline(undefined)).toBe(false);
    });

    it('returns true when status is online', () => {
      expect(isDeviceOnline({ status: 'online' })).toBe(true);
    });

    it('returns true when is_online is true', () => {
      expect(isDeviceOnline({ is_online: true })).toBe(true);
      expect(isDeviceOnline({ status: 'offline', is_online: true })).toBe(true);
    });

    it('returns false when neither status is online nor is_online is true', () => {
      expect(isDeviceOnline({ status: 'offline' })).toBe(false);
      expect(isDeviceOnline({ status: 'offline', is_online: false })).toBe(false);
      expect(isDeviceOnline({})).toBe(false);
    });
  });
});
