import { TestBed } from '@angular/core/testing';
import { StudioInspectionStore, MIN_TRIM_INTERVAL_SEC } from './studio-inspection.store';
import { StudioHistoryService } from '../../../core/services/studio-history.service';
import { StudioService } from '../../../core/services/studio.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { of } from 'rxjs';
import { mockStudioSessionSummaries } from '../../../../testing/mocks/studio-history.mock';
import { mockStudioSessionReadingsResponse } from '../../../../testing/mocks/telemetry.mock';

describe('StudioInspectionStore', () => {
  let store: StudioInspectionStore;
  let mockStudioHistoryService: jasmine.SpyObj<StudioHistoryService>;
  let mockStudioService: jasmine.SpyObj<StudioService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockStudioHistoryService = jasmine.createSpyObj('StudioHistoryService', [
      'getSessionReadings',
      'confirmSession',
      'updateSessionLabel',
      'deleteSession',
      'updateSessionValidation',
    ]);
    mockStudioService = jasmine.createSpyObj('StudioService', ['trimSession']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockStudioHistoryService.getSessionReadings.and.returnValue(of(mockStudioSessionReadingsResponse));
    mockStudioHistoryService.confirmSession.and.returnValue(
      of({ ...mockStudioSessionSummaries[0], is_validated: true })
    );
    mockStudioHistoryService.updateSessionLabel.and.returnValue(
      of({ ...mockStudioSessionSummaries[0], label: 'run' })
    );
    mockStudioHistoryService.deleteSession.and.returnValue(of(undefined));
    mockStudioHistoryService.updateSessionValidation.and.returnValue(
      of({ ...mockStudioSessionSummaries[0], is_validated: false })
    );
    mockStudioService.trimSession.and.returnValue(
      of({ ...mockStudioSessionSummaries[1], duration_sec: 2, sample_count: 100 })
    );

    TestBed.configureTestingModule({
      providers: [
        StudioInspectionStore,
        { provide: StudioHistoryService, useValue: mockStudioHistoryService },
        { provide: StudioService, useValue: mockStudioService },
        { provide: ToastService, useValue: mockToastService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });

    store = TestBed.inject(StudioInspectionStore);
  });

  it('should be initialized with default state', () => {
    expect(store.session()).toBeNull();
    expect(store.activeReadings().length).toBe(0);
    expect(store.isLoadingReadings()).toBeFalse();
    expect(store.trimStartOffsetSec()).toBe(0);
    expect(store.trimEndOffsetSec()).toBe(2);
    expect(store.showLabelEditor()).toBeFalse();
  });

  it('should initialize session state and load readings when setSession is called', () => {
    const session = mockStudioSessionSummaries[0];
    store.setSession(session);

    expect(store.session()).toEqual(session);
    expect(store.currentSessionId()).toBe(session.uuid);
    expect(mockStudioHistoryService.getSessionReadings).toHaveBeenCalledWith(session.uuid);
    expect(store.activeReadings().length).toBeGreaterThan(0);
    expect(store.trimEndOffsetSec()).toBe(Math.min(session.duration_sec, 30));
  });

  it('should sync predefined label correctly', () => {
    const session = { ...mockStudioSessionSummaries[0], label: 'walk' };
    store.setSession(session);

    expect(store.labelEditMode()).toBe('predefined');
    expect(store.editLabelValue()).toBe('walk');
  });

  it('should sync custom label correctly', () => {
    const session = { ...mockStudioSessionSummaries[0], label: 'custom_jump_action' };
    store.setSession(session);

    expect(store.labelEditMode()).toBe('custom');
    expect(store.customLabelValue()).toBe('custom_jump_action');
  });

  it('should clamp trim handles respecting MIN_TRIM_INTERVAL_SEC', () => {
    const session = { ...mockStudioSessionSummaries[0], duration_sec: 10 };
    store.setSession(session);

    store.onTrimEndChanged(8);
    expect(store.trimEndOffsetSec()).toBe(8);

    // Try setting start too close to end (e.g. 7.5 when min is 2)
    store.onTrimStartChanged(7.5);
    expect(store.trimStartOffsetSec()).toBeLessThanOrEqual(8 - MIN_TRIM_INTERVAL_SEC);

    // Try setting end too close to start
    store.onTrimStartChanged(2);
    store.onTrimEndChanged(3);
    expect(store.trimEndOffsetSec()).toBeGreaterThanOrEqual(2 + MIN_TRIM_INTERVAL_SEC);
  });

  it('should confirm session successfully', () => {
    const session = mockStudioSessionSummaries[0];
    store.setSession(session);

    let callbackCalled = false;
    store.confirmSession((updated) => {
      callbackCalled = true;
      expect(updated.is_validated).toBeTrue();
    });

    expect(mockStudioHistoryService.confirmSession).toHaveBeenCalledWith(session.uuid);
    expect(mockToastService.success).toHaveBeenCalled();
    expect(callbackCalled).toBeTrue();
  });

  it('should execute trimSession and update active readings', () => {
    const session = { ...mockStudioSessionSummaries[0], is_validated: false, duration_sec: 10 };
    store.setSession(session);

    store.onTrimStartChanged(1);
    store.onTrimEndChanged(6);

    let callbackCalled = false;
    store.trimSession((updated) => {
      callbackCalled = true;
      expect(updated.duration_sec).toBe(2);
    });

    expect(mockStudioService.trimSession).toHaveBeenCalledWith(session.uuid, 1, 6);
    expect(mockToastService.success).toHaveBeenCalled();
    expect(callbackCalled).toBeTrue();
  });

  it('should unvalidate session via reopenSession', () => {
    const session = { ...mockStudioSessionSummaries[0], is_validated: true };
    store.setSession(session);

    let callbackCalled = false;
    store.reopenSession((updated) => {
      callbackCalled = true;
      expect(updated.is_validated).toBeFalse();
    });

    expect(mockStudioHistoryService.updateSessionValidation).toHaveBeenCalledWith(session.uuid, false);
    expect(mockToastService.success).toHaveBeenCalled();
    expect(callbackCalled).toBeTrue();
  });

  it('should update label via updateLabel', () => {
    const session = { ...mockStudioSessionSummaries[0], label: 'walk', is_validated: false };
    store.setSession(session);

    store.editLabelValue.set('run');
    expect(store.canSaveLabel()).toBeTrue();

    let callbackCalled = false;
    store.updateLabel((updated) => {
      callbackCalled = true;
      expect(updated.label).toBe('run');
    });

    expect(mockStudioHistoryService.updateSessionLabel).toHaveBeenCalledWith(session.uuid, 'run');
    expect(mockToastService.success).toHaveBeenCalled();
    expect(callbackCalled).toBeTrue();
  });

  it('should handle session deletion', () => {
    const session = mockStudioSessionSummaries[0];
    store.setSession(session);

    let deleteInitiatedId: string | null = null;
    store.deleteSession((id) => {
      deleteInitiatedId = id;
    });

    expect(deleteInitiatedId).toBe(session.uuid);
    expect(mockStudioHistoryService.deleteSession).toHaveBeenCalledWith(session.uuid);
    expect(mockToastService.info).toHaveBeenCalled();
  });
});
