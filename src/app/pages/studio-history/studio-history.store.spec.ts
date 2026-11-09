import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StudioHistoryStore } from './studio-history.store';
import { AuthService } from '../../core/services/auth.service';
import { DeviceService } from '../../core/services/device.service';
import { StudioHistoryService } from '../../core/services/studio-history.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../core/services/translation.service';
import { mockDevices } from '../../../testing/mocks/device.mock';
import {
  mockPaginatedSessionsResponse,
  mockStudioSessionSummaries,
} from '../../../testing/mocks/studio-history.mock';

describe('StudioHistoryStore', () => {
  let store: StudioHistoryStore;
  let mockStudioHistoryService: jasmine.SpyObj<StudioHistoryService>;
  let mockDeviceService: jasmine.SpyObj<DeviceService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockStudioHistoryService = jasmine.createSpyObj('StudioHistoryService', [
      'getSessions',
      'getSessionReadings',
      'confirmSession',
      'updateSessionLabel',
      'updateSessionValidation',
      'deleteSession',
      'getAuthors',
    ]);
    mockDeviceService = jasmine.createSpyObj('DeviceService', ['getDevices']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['user'], {
      currentUser: () => ({ role: 'admin' }),
    });
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockStudioHistoryService.getSessions.and.returnValue(of(mockPaginatedSessionsResponse));
    mockStudioHistoryService.getAuthors.and.returnValue(of([]));
    mockDeviceService.getDevices.and.returnValue(of(mockDevices));

    TestBed.configureTestingModule({
      providers: [
        StudioHistoryStore,
        { provide: StudioHistoryService, useValue: mockStudioHistoryService },
        { provide: DeviceService, useValue: mockDeviceService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });

    store = TestBed.inject(StudioHistoryStore);
  });

  it('should initialize with default pagination and filter state', () => {
    expect(store.page()).toBe(1);
    expect(store.size()).toBe(20);
    expect(store.sessions().length).toBe(0);
    expect(store.inspectingSession()).toBeNull();
    expect(store.hasPreviousSession()).toBeFalse();
    expect(store.hasNextSession()).toBeFalse();
  });

  it('should manage drawer inspection state and navigation', () => {
    store.sessions.set([...mockStudioSessionSummaries]);
    expect(store.sessions().length).toBeGreaterThan(1);

    const first = mockStudioSessionSummaries[0];
    const second = mockStudioSessionSummaries[1];

    store.openInspection(first);
    expect(store.inspectingSession()).toEqual(first);
    expect(store.hasPreviousSession()).toBeFalse();
    expect(store.hasNextSession()).toBeTrue();

    store.goToNextSession();
    expect(store.inspectingSession()).toEqual(second);
    expect(store.hasPreviousSession()).toBeTrue();

    store.goToPreviousSession();
    expect(store.inspectingSession()).toEqual(first);

    store.closeInspection();
    expect(store.inspectingSession()).toBeNull();
    expect(store.hasPreviousSession()).toBeFalse();
    expect(store.hasNextSession()).toBeFalse();
  });

  it('should navigate across pages when at boundary', () => {
    mockStudioHistoryService.getSessions.and.returnValue(
      of({ ...mockPaginatedSessionsResponse, page: 2, items: [mockStudioSessionSummaries[1]] })
    );

    store.sessions.set([mockStudioSessionSummaries[0]]);
    store.total.set(100);
    store.size.set(1);
    store.page.set(1);

    store.openInspection(mockStudioSessionSummaries[0]);
    expect(store.hasNextSession()).toBeTrue();

    store.goToNextSession();
    expect(store.page()).toBe(2);
    expect(mockStudioHistoryService.getSessions).toHaveBeenCalled();
  });

  it('should update inspectingSession when onSessionUpdatedFromInspection is called', () => {
    store.sessions.set([...mockStudioSessionSummaries]);
    const original = mockStudioSessionSummaries[0];
    store.openInspection(original);

    const updated = { ...original, label: 'sprint' };
    store.onSessionUpdatedFromInspection(updated);

    expect(store.inspectingSession()).toEqual(updated);
    expect(store.sessions()[0].label).toBe('sprint');
  });

  it('should close drawer on session deletion if deleted session was inspected', () => {
    store.sessions.set([...mockStudioSessionSummaries]);
    const target = mockStudioSessionSummaries[0];
    store.openInspection(target);

    store.onSessionDeletedFromInspection(target.uuid);
    expect(store.inspectingSession()).toBeNull();
    expect(store.sessions().some((s) => s.uuid === target.uuid)).toBeFalse();
  });
});
