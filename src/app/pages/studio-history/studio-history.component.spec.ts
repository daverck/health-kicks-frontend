import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { StudioHistoryComponent } from './studio-history.component';
import { AuthService } from '../../core/services/auth.service';
import { DeviceService } from '../../core/services/device.service';
import { StudioHistoryService } from '../../core/services/studio-history.service';
import { ToastService } from '../../core/services/toast.service';
import { UserResponse } from '../../models/api.models';
import { mockDevices } from '../../../testing/mocks/device.mock';
import {
  mockPaginatedSessionsResponse,
  mockStudioSessionSummaries,
} from '../../../testing/mocks/studio-history.mock';
import { mockStudioSessionReadingsResponse } from '../../../testing/mocks/telemetry.mock';

describe('StudioHistoryComponent', () => {
  let component: StudioHistoryComponent;
  let fixture: ComponentFixture<StudioHistoryComponent>;
  let studioHistoryServiceSpy: jasmine.SpyObj<StudioHistoryService>;
  let deviceServiceSpy: jasmine.SpyObj<DeviceService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  const regularUser: UserResponse = {
    id: 42,
    email: 'user@test.com',
    name: 'Normal User',
    role: 'user',
    is_active: true,
  };

  const adminUser: UserResponse = {
    id: 1,
    email: 'admin@test.com',
    name: 'Admin Boss',
    role: 'admin',
    is_active: true,
  };

  const currentUserSignal = signal<UserResponse | null>(regularUser);

  beforeEach(async () => {
    currentUserSignal.set(regularUser);

    studioHistoryServiceSpy = jasmine.createSpyObj('StudioHistoryService', [
      'getSessions',
      'getSessionReadings',
      'updateSessionLabel',
      'deleteSession',
    ]);
    studioHistoryServiceSpy.getSessions.and.returnValue(of(mockPaginatedSessionsResponse));
    studioHistoryServiceSpy.getSessionReadings.and.returnValue(of(mockStudioSessionReadingsResponse));
    studioHistoryServiceSpy.updateSessionLabel.and.returnValue(
      of({ ...mockStudioSessionSummaries[0], label: 'run' })
    );
    studioHistoryServiceSpy.deleteSession.and.returnValue(of(undefined));

    deviceServiceSpy = jasmine.createSpyObj('DeviceService', ['listDevices']);
    deviceServiceSpy.listDevices.and.returnValue(of(mockDevices));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      user: currentUserSignal.asReadonly(),
    });

    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [StudioHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: StudioHistoryService, useValue: studioHistoryServiceSpy },
        { provide: DeviceService, useValue: deviceServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioHistoryComponent);
    component = fixture.componentInstance;
  });

  it('should create and load devices and sessions on init with default params', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(deviceServiceSpy.listDevices).toHaveBeenCalled();
    expect(studioHistoryServiceSpy.getSessions).toHaveBeenCalledWith({
      page: 1,
      size: 20,
    });
    expect(component.sessions().length).toBe(3);
    expect(component.total()).toBe(3);
    expect(component.page()).toBe(1);
    expect(component.size()).toBe(20);
    expect(component.devices().length).toBe(2);
  });

  it('should NOT display author column or user_id filter when role is regular user', () => {
    currentUserSignal.set(regularUser);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#filter-user-id')).toBeNull();
    expect(compiled.querySelector('.author-col')).toBeNull();
    expect(compiled.querySelector('.author-cell')).toBeNull();
  });

  it('should display author column and user_id filter when role is admin', () => {
    currentUserSignal.set(adminUser);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#filter-user-id')).toBeTruthy();
    expect(compiled.querySelector('.author-col')).toBeTruthy();
    const authorCells = compiled.querySelectorAll('.author-cell');
    expect(authorCells.length).toBe(3);
    expect(authorCells[0].textContent).toContain('admin@healthkicks.org');
  });

  it('should filter by label, device, user_id (for admin), dates and reset page to 1', () => {
    currentUserSignal.set(adminUser);
    fixture.detectChanges();

    component.selectedLabel.set('fall_forward');
    component.selectedDeviceId.set('hk-device-0001');
    component.filterUserId.set('2');
    component.startDate.set('2026-09-01');
    component.endDate.set('2026-09-10');
    component.onFilterChange();

    expect(studioHistoryServiceSpy.getSessions).toHaveBeenCalledWith({
      page: 1,
      size: 20,
      label: 'fall_forward',
      device_id: 'hk-device-0001',
      user_id: 2,
      start_date: '2026-09-01',
      end_date: '2026-09-10',
    });
  });

  it('should reset filters and reload sessions', () => {
    fixture.detectChanges();

    component.selectedLabel.set('stairs');
    component.selectedDeviceId.set('hk-device-0002');
    component.startDate.set('2026-09-01');
    component.endDate.set('2026-09-10');
    component.resetFilters();

    expect(component.selectedLabel()).toBe('');
    expect(component.selectedDeviceId()).toBe('');
    expect(component.filterUserId()).toBe('');
    expect(component.startDate()).toBe('');
    expect(component.endDate()).toBe('');
    expect(component.page()).toBe(1);
    expect(studioHistoryServiceSpy.getSessions).toHaveBeenCalledWith({
      page: 1,
      size: 20,
    });
  });

  it('should handle pagination: next page, previous page and page size change', () => {
    // Mock response with total 50 to allow page 2
    studioHistoryServiceSpy.getSessions.and.callFake((params) =>
      of({
        ...mockPaginatedSessionsResponse,
        total: 50,
        page: params?.page ?? 1,
        size: params?.size ?? 20,
      })
    );
    fixture.detectChanges();

    expect(component.totalPages()).toBe(3);

    component.goToPage(2);
    expect(component.page()).toBe(2);
    expect(studioHistoryServiceSpy.getSessions).toHaveBeenCalledWith({
      page: 2,
      size: 20,
    });

    component.onPageSizeChange(50);
    expect(component.size()).toBe(50);
    expect(component.page()).toBe(1);
    expect(studioHistoryServiceSpy.getSessions).toHaveBeenCalledWith({
      page: 1,
      size: 50,
    });
  });

  it('should open inspection drawer, fetch telemetry readings and pass to ImuChartComponent', () => {
    fixture.detectChanges();

    const targetSession = mockStudioSessionSummaries[0];
    component.openInspection(targetSession);
    fixture.detectChanges();

    expect(component.inspectingSession()).toEqual(targetSession);
    expect(studioHistoryServiceSpy.getSessionReadings).toHaveBeenCalledWith('sess-001');
    expect(component.activeReadings()).toEqual(mockStudioSessionReadingsResponse.readings);

    const compiled = fixture.nativeElement as HTMLElement;
    const drawer = compiled.querySelector('#inspection-drawer');
    expect(drawer).toBeTruthy();

    const chart = compiled.querySelector('app-imu-chart');
    expect(chart).toBeTruthy();

    // Close drawer
    component.closeInspection();
    fixture.detectChanges();
    expect(component.inspectingSession()).toBeNull();
    expect(compiled.querySelector('#inspection-drawer')).toBeNull();
  });

  it('should navigate between previous and next sessions in inspection drawer', () => {
    fixture.detectChanges();

    // Open first session (sess-001)
    component.openInspection(mockStudioSessionSummaries[0]);
    fixture.detectChanges();

    expect(component.currentSessionIndex()).toBe(0);
    expect(component.hasPreviousSession()).toBeFalse();
    expect(component.hasNextSession()).toBeTrue();

    const compiled = fixture.nativeElement as HTMLElement;
    const prevBtn: HTMLButtonElement | null = compiled.querySelector('[data-testid="prev-session-btn"]');
    const nextBtn: HTMLButtonElement | null = compiled.querySelector('[data-testid="next-session-btn"]');

    expect(prevBtn).toBeTruthy();
    expect(nextBtn).toBeTruthy();
    expect(prevBtn?.disabled).toBeTrue();
    expect(nextBtn?.disabled).toBeFalse();

    // Click Next -> should inspect sess-002
    nextBtn?.click();
    fixture.detectChanges();

    expect(component.inspectingSession()?.id).toBe('sess-002');
    expect(component.currentSessionIndex()).toBe(1);
    expect(component.hasPreviousSession()).toBeTrue();
    expect(component.hasNextSession()).toBeTrue();
    expect(prevBtn?.disabled).toBeFalse();
    expect(nextBtn?.disabled).toBeFalse();

    // Click Next again -> should inspect sess-003
    nextBtn?.click();
    fixture.detectChanges();

    expect(component.inspectingSession()?.id).toBe('sess-003');
    expect(component.currentSessionIndex()).toBe(2);
    expect(component.hasPreviousSession()).toBeTrue();
    expect(component.hasNextSession()).toBeFalse();
    expect(nextBtn?.disabled).toBeTrue();

    // Click Prev -> should navigate back to sess-002
    prevBtn?.click();
    fixture.detectChanges();

    expect(component.inspectingSession()?.id).toBe('sess-002');
    expect(component.currentSessionIndex()).toBe(1);

    // Escape closes drawer
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(component.inspectingSession()).toBeNull();
  });

  it('should update session label and update session in local list', () => {
    fixture.detectChanges();

    const targetSession = mockStudioSessionSummaries[0];
    component.openInspection(targetSession);
    fixture.detectChanges();

    component.editLabelValue.set('run');
    component.updateLabel();

    expect(studioHistoryServiceSpy.updateSessionLabel).toHaveBeenCalledWith('sess-001', 'run');
    expect(toastSpy.success).toHaveBeenCalled();
    expect(component.inspectingSession()?.label).toBe('run');
    expect(component.sessions().find((s) => s.id === 'sess-001')?.label).toBe('run');
  });

  it('should delete session with confirmation, update list and close drawer', () => {
    fixture.detectChanges();

    const targetSession = mockStudioSessionSummaries[0];
    component.openInspection(targetSession);
    fixture.detectChanges();

    expect(component.showDeleteConfirm()).toBeFalse();
    component.confirmDelete();
    expect(component.showDeleteConfirm()).toBeTrue();

    component.deleteSession();

    expect(studioHistoryServiceSpy.deleteSession).toHaveBeenCalledWith('sess-001');
    expect(toastSpy.info).toHaveBeenCalled();
    expect(component.inspectingSession()).toBeNull();
    expect(component.sessions().some((s) => s.id === 'sess-001')).toBeFalse();
    expect(component.total()).toBe(2);
  });

  it('should handle sessions loading error gracefully', () => {
    studioHistoryServiceSpy.getSessions.and.returnValue(
      throwError(() => ({ status: 500, error: { detail: 'Erreur base de données' } }))
    );

    component.loadSessions();

    expect(component.isLoading()).toBeFalse();
    expect(component.errorMessage()).toBe('Erreur base de données');
  });

  it('should handle telemetry loading error in drawer gracefully', () => {
    studioHistoryServiceSpy.getSessionReadings.and.returnValue(
      throwError(() => ({ status: 404, error: { detail: 'Trames introuvables sur DynamoDB' } }))
    );

    component.openInspection(mockStudioSessionSummaries[0]);

    expect(component.isLoadingReadings()).toBeFalse();
    expect(component.readingsError()).toBe('Trames introuvables sur DynamoDB');
  });

  it('should style idle sessions with slate badge and allow filtering by idle', () => {
    fixture.detectChanges();

    // Check badge class
    const idleBadge = component.getLabelBadgeClass('idle');
    expect(idleBadge).toContain('bg-slate-100');
    expect(idleBadge).toContain('text-slate-800');

    // Check predefinedLabels has idle
    const idleDef = component.predefinedLabels.find((l) => l.id === 'idle');
    expect(idleDef).toBeDefined();
    expect(idleDef?.icon).toBe('⏸️');

    // Filter by idle
    component.selectedLabel.set('idle');
    component.onFilterChange();

    expect(studioHistoryServiceSpy.getSessions).toHaveBeenCalledWith(
      jasmine.objectContaining({
        label: 'idle',
        page: 1,
        size: 20,
      })
    );
  });
});
