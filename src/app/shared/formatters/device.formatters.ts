/**
 * Utility formatters for device presentation and online status resolution.
 */

export interface DeviceDisplayable {
  device_id: string;
  name?: string | null;
}

export interface DeviceStatusable {
  status?: string | null;
  is_online?: boolean | null;
}

/**
 * Returns the friendly name of a device, falling back to its device_id if missing or empty.
 */
export function getDeviceDisplayName(device: DeviceDisplayable | null | undefined): string {
  if (!device) return '';
  const trimmed = device.name?.trim();
  return trimmed || device.device_id;
}

/**
 * Evaluates whether a device is currently online.
 */
export function isDeviceOnline(device: DeviceStatusable | null | undefined): boolean {
  if (!device) return false;
  return device.status === 'online' || Boolean(device.is_online);
}

/**
 * Selects the preferred active device from a collection, prioritizing online devices
 * before falling back to the first available device.
 */
export function resolvePreferredDevice<T extends DeviceStatusable>(
  devices: T[] | null | undefined
): T | null {
  if (!devices || devices.length === 0) {
    return null;
  }
  return devices.find((d) => isDeviceOnline(d)) ?? devices[0];
}
