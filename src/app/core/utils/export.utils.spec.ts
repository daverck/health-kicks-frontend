import {
  exportSessionToJson,
  downloadJsonFile,
  ExportedSessionJson,
} from './export.utils';
import { StudioSessionSummary } from '../../models/studio-history.model';
import { ImuReading } from '../../models/telemetry.models';

describe('export.utils', () => {
  const mockSession: StudioSessionSummary = {
    id: 'sess-test-01',
    device_id: 'hk-esp32-001',
    label: 'walk',
    sample_count: 3,
    duration_sec: 1.5,
    created_at: '2026-09-20T12:00:00Z',
    is_validated: true,
    user_id: 42,
  };

  const mockReadings: ImuReading[] = [
    {
      timestamp_epoch_us: 1726833600000000,
      timestamp_iso: '2026-09-20T12:00:00.000Z',
      ax: 0.1,
      ay: 0.98,
      az: 0.05,
      gx: 1.2,
      gy: -0.5,
      gz: 0.0,
      label: 'walk',
      session_id: 'sess-test-01',
    },
    {
      timestamp_epoch_us: 1726833600020000,
      timestamp_iso: '2026-09-20T12:00:00.020Z',
      ax: 0.15,
      ay: 0.95,
      az: 0.08,
      gx: 1.4,
      gy: -0.4,
      gz: 0.1,
      label: 'walk',
      session_id: 'sess-test-01',
    },
  ];

  let createObjectURLSpy: jasmine.Spy;
  let revokeObjectURLSpy: jasmine.Spy;

  beforeEach(() => {
    createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/dummy');
    revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL').and.stub();
  });

  it('should trigger download with formatted JSON string', () => {
    let appendedAnchor: HTMLAnchorElement | null = null;
    const appendChildSpy = spyOn(document.body, 'appendChild').and.callFake((node) => {
      if (node instanceof HTMLAnchorElement) {
        appendedAnchor = node;
      }
      return node;
    });
    const removeChildSpy = spyOn(document.body, 'removeChild').and.stub();

    downloadJsonFile({ key: 'value' }, 'test_file.json');

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(appendedAnchor).not.toBeNull();
    const anchor = appendedAnchor as unknown as HTMLAnchorElement;
    expect(anchor.download).toBe('test_file.json');
    expect(anchor.href).toBe('blob:http://localhost/dummy');
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/dummy');
  });

  it('should format session metadata and readings correctly in exportSessionToJson', () => {
    let capturedBlob: Blob | null = null;
    createObjectURLSpy.and.callFake((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock';
    });

    exportSessionToJson(mockSession, mockReadings);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(capturedBlob).not.toBeNull();
    const b = capturedBlob as unknown as Blob;
    expect(b.type).toContain('application/json');
  });

  it('should handle null session and empty readings safely', () => {
    let capturedBlob: Blob | null = null;
    createObjectURLSpy.and.callFake((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock';
    });

    exportSessionToJson(null, []);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(capturedBlob).not.toBeNull();
  });
});
