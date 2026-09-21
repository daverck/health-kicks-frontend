import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
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
      'confirmSession',
      'updateSessionLabel',
      'deleteSession',
    ]);
    studioHistoryServiceSpy.getSessions.and.returnValue(of(mockPaginatedSessionsResponse));
    studioHistoryServiceSpy.getSessionReadings.and.returnValue(of(mockStudioSessionReadingsResponse));
    studioHistoryServiceSpy.confirmSession.and.returnValue(
      of({ ...mockStudioSessionSummaries[1], is_validated: true })
    );
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

  it('should filter by label, device, user_id (for admin), dates, is_validated and reset page to 1', () => {
    currentUserSignal.set(adminUser);
    fixture.detectChanges();

    component.selectedLabel.set('fall_forward');
    component.selectedDeviceId.set('hk-device-0001');
    component.filterUserId.set('2');
    component.startDate.set('2026-09-01');
    component.endDate.set('2026-09-10');
    component.selectedValidated.set('true');
    component.onFilterChange();

    expect(studioHistoryServiceSpy.getSessions).toHaveBeenCalledWith({
      page: 1,
      size: 20,
      label: 'fall_forward',
      device_id: 'hk-device-0001',
      user_id: 2,
      start_date: '2026-09-01',
      end_date: '2026-09-10',
      is_validated: true,
    });
  });

  it('should filter by is_validated=false when pending is selected', () => {
    fixture.detectChanges();

    component.selectedValidated.set('false');
    component.onFilterChange();

    expect(studioHistoryServiceSpy.getSessions).toHaveBeenCalledWith({
      page: 1,
      size: 20,
      is_validated: false,
    });
  });

  it('should display status badges in table and drawer', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const validatedBadges = compiled.querySelectorAll('[data-testid="badge-validated"]');
    const pendingBadges = compiled.querySelectorAll('[data-testid="badge-pending"]');

    expect(validatedBadges.length).toBe(2);
    expect(pendingBadges.length).toBe(1);

    // Open pending session (sess-002) in drawer
    component.openInspection(mockStudioSessionSummaries[1]);
    fixture.detectChanges();

    const drawerPendingBadge = compiled.querySelector('[data-testid="inspection-badge-pending"]');
    expect(drawerPendingBadge).toBeTruthy();

    const drawerConfirmBtn = compiled.querySelector('#drawer-confirm-btn');
    expect(drawerConfirmBtn).toBeTruthy();
  });

  it('should update session and list when confirmed from inspection child component', () => {
    fixture.detectChanges();

    component.openInspection(mockStudioSessionSummaries[1]);
    fixture.detectChanges();

    const confirmedSession = { ...mockStudioSessionSummaries[1], is_validated: true };
    component.onSessionConfirmedFromInspection(confirmedSession);

    expect(component.inspectingSession()?.is_validated).toBeTrue();
    expect(component.sessions().find((s) => s.id === 'sess-002')?.is_validated).toBeTrue();
  });

  it('should reset filters including status and reload sessions', () => {
    fixture.detectChanges();

    component.selectedLabel.set('stairs');
    component.selectedDeviceId.set('hk-device-0002');
    component.startDate.set('2026-09-01');
    component.endDate.set('2026-09-10');
    component.selectedValidated.set('true');
    component.resetFilters();

    expect(component.selectedLabel()).toBe('');
    expect(component.selectedDeviceId()).toBe('');
    expect(component.filterUserId()).toBe('');
    expect(component.startDate()).toBe('');
    expect(component.endDate()).toBe('');
    expect(component.selectedValidated()).toBe('all');
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

  it('should open inspection drawer and render inspection component with active session', () => {
    fixture.detectChanges();

    const targetSession = mockStudioSessionSummaries[0];
    component.openInspection(targetSession);
    fixture.detectChanges();

    expect(component.inspectingSession()).toEqual(targetSession);

    const compiled = fixture.nativeElement as HTMLElement;
    const drawer = compiled.querySelector('#inspection-drawer');
    expect(drawer).toBeTruthy();

    const inspectionComponent = compiled.querySelector('app-studio-inspection');
    expect(inspectionComponent).toBeTruthy();

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

    // Next session
    component.goToNextSession();
    fixture.detectChanges();

    expect(component.inspectingSession()?.id).toBe('sess-002');
    expect(component.currentSessionIndex()).toBe(1);
    expect(component.hasPreviousSession()).toBeTrue();
    expect(component.hasNextSession()).toBeTrue();

    // Next session again
    component.goToNextSession();
    fixture.detectChanges();

    expect(component.inspectingSession()?.id).toBe('sess-003');
    expect(component.currentSessionIndex()).toBe(2);
    expect(component.hasPreviousSession()).toBeTrue();
    expect(component.hasNextSession()).toBeFalse();

    // Previous session
    component.goToPreviousSession();
    fixture.detectChanges();

    expect(component.inspectingSession()?.id).toBe('sess-002');
    expect(component.currentSessionIndex()).toBe(1);

    // Escape closes drawer
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(component.inspectingSession()).toBeNull();
  });

  it('should update session and list when label is updated from inspection child component', () => {
    fixture.detectChanges();

    const targetSession = mockStudioSessionSummaries[0];
    component.openInspection(targetSession);
    fixture.detectChanges();

    const updatedSession = { ...targetSession, label: 'run' };
    component.onSessionUpdatedFromInspection(updatedSession);

    expect(component.inspectingSession()?.label).toBe('run');
    expect(component.sessions().find((s) => s.id === 'sess-001')?.label).toBe('run');
  });

  it('should delete session from inspection child component, update list and close drawer', () => {
    fixture.detectChanges();

    const targetSession = mockStudioSessionSummaries[0];
    component.openInspection(targetSession);
    fixture.detectChanges();

    component.onSessionDeletedFromInspection('sess-001');

    expect(component.inspectingSession()).toBeNull();
    expect(component.sessions().some((s) => s.id === 'sess-001')).toBeFalse();
    expect(component.total()).toBe(2);
  });

  it('should delete session directly from list via row delete button without loading IMU readings', () => {
    fixture.detectChanges();

    // Reset spy calls to be certain getSessionReadings was not called
    studioHistoryServiceSpy.getSessionReadings.calls.reset();

    const targetSession = mockStudioSessionSummaries[1]; // sess-002
    component.promptDeleteSession(targetSession);
    fixture.detectChanges();

    expect(component.sessionToDelete()).toEqual(targetSession);
    expect(component.inspectingSession()).toBeNull();
    expect(studioHistoryServiceSpy.getSessionReadings).not.toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    const confirmBtn = compiled.querySelector('[data-testid="confirm-modal-delete-btn"]') as HTMLButtonElement;
    expect(confirmBtn).toBeTruthy();

    confirmBtn.click();
    fixture.detectChanges();

    expect(studioHistoryServiceSpy.deleteSession).toHaveBeenCalledWith('sess-002');
    expect(toastSpy.info).toHaveBeenCalled();
    expect(component.sessionToDelete()).toBeNull();
    expect(component.sessions().some((s) => s.id === 'sess-002')).toBeFalse();
    expect(component.total()).toBe(2);
    expect(studioHistoryServiceSpy.getSessionReadings).not.toHaveBeenCalled();
  });

  it('should allow confirming multiple deletions in parallel without modal confirm button being disabled', () => {
    // Return a delayed observable for the first deletion to simulate in-flight request
    const pendingSubject = new Subject<void>();
    studioHistoryServiceSpy.deleteSession.and.callFake((id: string) => {
      if (id === 'sess-001') {
        return pendingSubject.asObservable();
      }
      return of(undefined);
    });

    fixture.detectChanges();

    // 1. Trigger deletion for first session (sess-001)
    component.promptDeleteSession(mockStudioSessionSummaries[0]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const confirmBtn1 = compiled.querySelector('[data-testid="confirm-modal-delete-btn"]') as HTMLButtonElement;
    expect(confirmBtn1.disabled).toBeFalse();

    confirmBtn1.click();
    fixture.detectChanges();

    expect(component.sessionToDelete()).toBeNull();
    expect(component.isDeletingSession()).toBeTrue();
    expect(component.sessions().some((s) => s.id === 'sess-001')).toBeFalse();

    // 2. Immediately trigger deletion for second session (sess-002) while sess-001 is still in flight
    component.promptDeleteSession(mockStudioSessionSummaries[1]);
    fixture.detectChanges();

    const confirmBtn2 = compiled.querySelector('[data-testid="confirm-modal-delete-btn"]') as HTMLButtonElement;
    expect(confirmBtn2).toBeTruthy();
    expect(confirmBtn2.disabled).toBeFalse();

    confirmBtn2.click();
    fixture.detectChanges();

    expect(studioHistoryServiceSpy.deleteSession).toHaveBeenCalledWith('sess-002');
    expect(component.sessions().some((s) => s.id === 'sess-002')).toBeFalse();

    // Complete first deletion
    pendingSubject.next();
    pendingSubject.complete();
    fixture.detectChanges();

    expect(component.isDeletingSession()).toBeFalse();
  });

  it('should cancel direct list deletion when cancel button or escape key is pressed', () => {
    fixture.detectChanges();

    const targetSession = mockStudioSessionSummaries[0];
    component.promptDeleteSession(targetSession);
    fixture.detectChanges();

    expect(component.sessionToDelete()).toEqual(targetSession);

    // Cancel via method
    component.cancelPromptDelete();
    expect(component.sessionToDelete()).toBeNull();

    // Re-prompt and cancel via Escape
    component.promptDeleteSession(targetSession);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.sessionToDelete()).toBeNull();
    expect(studioHistoryServiceSpy.deleteSession).not.toHaveBeenCalled();
  });

  it('should handle sessions loading error gracefully', () => {
    studioHistoryServiceSpy.getSessions.and.returnValue(
      throwError(() => ({ status: 500, error: { detail: 'Erreur base de données' } }))
    );

    component.loadSessions();

    expect(component.isLoading()).toBeFalse();
    expect(component.errorMessage()).toBe('Erreur base de données');
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

  it('should format standard labels with translation and custom labels as raw strings without prefix', () => {
    fixture.detectChanges();

    // Standard labels
    expect(component.getLabelDisplayName('walk')).toBe('Marche');
    expect(component.getLabelDisplayName('run')).toBe('Course');
    expect(component.getLabelDisplayName('idle')).toBe('Immobile / Repos');

    // Custom labels
    expect(component.getLabelDisplayName('test')).toBe('test');
    expect(component.getLabelDisplayName('custom_sprint')).toBe('custom_sprint');
    expect(component.getLabelDisplayName('')).toBe('');

    // In rendered table
    component.sessions.set([
      {
        id: 'sess-custom',
        device_id: 'hk-esp32-001',
        user_id: 1,
        label: 'test_movement',
        sample_count: 50,
        duration_sec: 1.0,
        created_at: '2026-09-18T10:00:00Z',
        is_validated: false,
      },
    ]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('test_movement');
    expect(compiled.textContent).not.toContain('studio.labels.test_movement');
  });

  it('should render mobile session cards and allow inspecting a session from mobile view', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const mobileCard = compiled.querySelector('[data-testid="mobile-session-card-sess-001"]') as HTMLElement;
    expect(mobileCard).toBeTruthy();

    const mobileInspectBtn = compiled.querySelector('#inspect-mobile-btn-sess-001') as HTMLButtonElement;
    expect(mobileInspectBtn).toBeTruthy();

    spyOn(component, 'openInspection').and.callThrough();
    mobileInspectBtn.click();
    fixture.detectChanges();

    expect(component.openInspection).toHaveBeenCalledWith(mockStudioSessionSummaries[0]);
    expect(component.inspectingSession()?.id).toBe('sess-001');
  });

  it('should toggle mobile filters panel', () => {
    fixture.detectChanges();

    expect(component.showMobileFilters()).toBeFalse();
    const toggleBtn = fixture.nativeElement.querySelector('#toggle-mobile-filters-btn') as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();

    toggleBtn.click();
    fixture.detectChanges();

    expect(component.showMobileFilters()).toBeTrue();
    expect(fixture.nativeElement.querySelector('#mobile-filter-validated')).toBeTruthy();
  });

  it('should add overflow-hidden to document.body when drawer is open and remove it when closed or destroyed', () => {
    fixture.detectChanges();

    expect(document.body.classList.contains('overflow-hidden')).toBeFalse();

    // Open drawer
    component.openInspection(mockStudioSessionSummaries[0]);
    fixture.detectChanges();

    expect(document.body.classList.contains('overflow-hidden')).toBeTrue();

    // Close drawer
    component.closeInspection();
    fixture.detectChanges();

    expect(document.body.classList.contains('overflow-hidden')).toBeFalse();

    // Reopen and destroy fixture
    component.openInspection(mockStudioSessionSummaries[0]);
    fixture.detectChanges();
    expect(document.body.classList.contains('overflow-hidden')).toBeTrue();

    fixture.destroy();
    expect(document.body.classList.contains('overflow-hidden')).toBeFalse();
  });

  it('should render experimental tag for custom sessions in mobile cards and desktop table', () => {
    const customSession = {
      ...mockStudioSessionSummaries[0],
      id: 'sess-custom-99',
      label: 'breakdance',
    };
    studioHistoryServiceSpy.getSessions.and.returnValue(of({
      items: [customSession],
      total: 1,
      page: 1,
      size: 20,
      pages: 1,
    }));

    component.loadSessions();
    fixture.detectChanges();

    expect(component.isCustomStudioLabel('breakdance')).toBeTrue();
    expect(component.getLabelIcon('breakdance')).toBe('🧪');
    expect(component.getLabelBadgeClass('breakdance')).toContain('purple');

    const compiled = fixture.nativeElement as HTMLElement;
    const mobileCustomBadge = compiled.querySelector('[data-testid="mobile-card-custom-badge"]');
    expect(mobileCustomBadge).toBeTruthy();
    expect(mobileCustomBadge?.textContent).toContain('🧪');

    const tableCustomBadge = compiled.querySelector('[data-testid="table-row-custom-badge"]');
    expect(tableCustomBadge).toBeTruthy();
    expect(tableCustomBadge?.textContent).toContain('🧪');
  });
});
