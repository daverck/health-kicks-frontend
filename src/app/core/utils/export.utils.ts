import { StudioSessionSummary } from '../../models/studio-history.model';
import { ImuReading } from '../../models/telemetry.models';

/**
 * Payload structure for exported IMU recording JSON file.
 */
export interface ExportedSessionJson {
  session: {
    uuid: string;
    device_id: string;
    label: string;
    sample_count: number;
    duration_sec: number;
    created_at: string;
    is_validated: boolean;
    author_pseudonym?: string | null;
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
  const sessionId = session?.uuid || 'session';
  const label = session?.label || 'recording';
  const filename = customFilename || `recording_${sessionId}_${label}.json`;

  const payload: ExportedSessionJson = {
    session: session
      ? {
          uuid: session.uuid,
          device_id: session.device_id,
          label: session.label,
          sample_count: session.sample_count,
          duration_sec: session.duration_sec,
          created_at: session.created_at,
          is_validated: session.is_validated,
          author_pseudonym: session.author_pseudonym,
        }
      : null,
    readings: readings || [],
    exported_at: new Date().toISOString(),
  };

  downloadJsonFile(payload, filename);
}

/**
 * Computes standard CRC-32 checksum for a byte array.
 */
export function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]!;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileEntry {
  filename: string;
  content: string | Uint8Array;
}

/**
 * Creates a standard uncompressed (Stored) ZIP archive Blob from an array of named file entries.
 * Fully compatible with standard ZIP extractors without external dependencies.
 */
export function createZipArchive(files: ZipFileEntry[]): Blob {
  const encoder = new TextEncoder();
  const fileEntries: {
    filenameBytes: Uint8Array;
    contentBytes: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  const parts: Uint8Array[] = [];
  let currentOffset = 0;

  // 1. Write Local File Headers + File Data
  for (const file of files) {
    const filenameBytes = encoder.encode(file.filename);
    const contentBytes = typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
    const crc = computeCrc32(contentBytes);

    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed to extract (2.0)
    view.setUint16(6, 0, true);          // General purpose bit flag
    view.setUint16(8, 0, true);          // Compression method: 0 (Store)
    view.setUint16(10, 0, true);         // Last mod time
    view.setUint16(12, 0, true);         // Last mod date
    view.setUint32(14, crc, true);       // CRC-32
    view.setUint32(18, contentBytes.length, true); // Compressed size
    view.setUint32(22, contentBytes.length, true); // Uncompressed size
    view.setUint16(26, filenameBytes.length, true); // Filename length
    view.setUint16(28, 0, true);         // Extra field length
    localHeader.set(filenameBytes, 30);

    parts.push(localHeader);
    parts.push(contentBytes);

    fileEntries.push({
      filenameBytes,
      contentBytes,
      crc,
      offset: currentOffset,
    });

    currentOffset += localHeader.length + contentBytes.length;
  }

  const centralDirectoryOffset = currentOffset;
  let centralDirectorySize = 0;

  // 2. Write Central Directory Headers
  for (const entry of fileEntries) {
    const cdHeader = new Uint8Array(46 + entry.filenameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central file header signature
    view.setUint16(4, 20, true);         // Version made by (2.0)
    view.setUint16(6, 20, true);         // Version needed (2.0)
    view.setUint16(8, 0, true);          // General purpose bit flag
    view.setUint16(10, 0, true);         // Compression method: 0 (Store)
    view.setUint16(12, 0, true);         // Mod time
    view.setUint16(14, 0, true);         // Mod date
    view.setUint32(16, entry.crc, true); // CRC-32
    view.setUint32(20, entry.contentBytes.length, true); // Compressed size
    view.setUint32(24, entry.contentBytes.length, true); // Uncompressed size
    view.setUint16(28, entry.filenameBytes.length, true); // Filename length
    view.setUint16(30, 0, true);         // Extra field length
    view.setUint16(32, 0, true);         // Comment length
    view.setUint16(34, 0, true);         // Disk number start
    view.setUint16(36, 0, true);         // Internal attributes
    view.setUint32(38, 0, true);         // External attributes
    view.setUint32(42, entry.offset, true); // Relative offset of local header
    cdHeader.set(entry.filenameBytes, 46);

    parts.push(cdHeader);
    centralDirectorySize += cdHeader.length;
  }

  // 3. Write End of Central Directory Record (EOCD)
  const eocd = new Uint8Array(22);
  const view = new DataView(eocd.buffer);

  view.setUint32(0, 0x06054b50, true); // EOCD signature
  view.setUint16(4, 0, true);          // Disk number
  view.setUint16(6, 0, true);          // Disk with central dir
  view.setUint16(8, fileEntries.length, true);  // Number of central dir records on this disk
  view.setUint16(10, fileEntries.length, true); // Total number of central dir records
  view.setUint32(12, centralDirectorySize, true); // Size of central directory
  view.setUint32(16, centralDirectoryOffset, true); // Offset of central directory
  view.setUint16(20, 0, true);         // Comment length
  parts.push(eocd);

  return new Blob(parts as BlobPart[], { type: 'application/zip' });
}

