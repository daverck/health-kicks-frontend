import { StudioSessionSummary } from '../../models/studio-history.model';
import { ImuReading } from '../../models/telemetry.models';

/**
 * Payload structure for exported IMU recording JSON file.
 */
export interface ExportedSessionJson {
  session: {
    id: string;
    device_id: string;
    label: string;
    sample_count: number;
    duration_sec: number;
    created_at: string;
    is_validated: boolean;
    user_id?: number | null;
  } | null;
  readings: ImuReading[];
  exported_at: string;
}

/**
 * Triggers a client-side browser file download from a JavaScript object as formatted JSON.
 */
export function downloadJsonFile(data: unknown, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Serializes and triggers the download of an IMU session and its telemetry readings as JSON.
 */
export function exportSessionToJson(
  session: StudioSessionSummary | null,
  readings: ImuReading[],
  customFilename?: string
): void {
  const sessionId = session?.id || 'session';
  const label = session?.label || 'recording';
  const filename = customFilename || `recording_${sessionId}_${label}.json`;

  const payload: ExportedSessionJson = {
    session: session
      ? {
          id: session.id,
          device_id: session.device_id,
          label: session.label,
          sample_count: session.sample_count,
          duration_sec: session.duration_sec,
          created_at: session.created_at,
          is_validated: session.is_validated,
          user_id: session.user_id,
        }
      : null,
    readings: readings || [],
    exported_at: new Date().toISOString(),
  };

  downloadJsonFile(payload, filename);
}

