import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StudioInspectionComponent } from './studio-inspection.component';
import { StudioHistoryService } from '../../../core/services/studio-history.service';
import { StudioService } from '../../../core/services/studio.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { of, throwError } from 'rxjs';
import { mockStudioSessionSummaries } from '../../../../testing/mocks/studio-history.mock';
import { mockStudioSessionReadingsResponse } from '../../../../testing/mocks/telemetry.mock';
import { provideRouter } from '@angular/router';

describe('StudioInspectionComponent', () => {
  let component: StudioInspectionComponent;
  let fixture: ComponentFixture<StudioInspectionComponent>;
  let mockStudioHistoryService: jasmine.SpyObj<StudioHistoryService>;
  let mockStudioService: jasmine.SpyObj<StudioService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
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
      of({ ...mockStudioSessionSummaries[1], duration_sec: 0.6, sample_count: 2 })
    );

    await TestBed.configureTestingModule({
      imports: [StudioInspectionComponent],
      providers: [
        provideRouter([]),
        { provide: StudioHistoryService, useValue: mockStudioHistoryService },
        { provide: StudioService, useValue: mockStudioService },
        { provide: ToastService, useValue: mockToastService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioInspectionComponent);
    component = fixture.componentInstance;
  });

  it('should create and load readings when session input is provided', () => {
    fixture.componentRef.setInput('session', mockStudioSessionSummaries[0]);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockStudioHistoryService.getSessionReadings).toHaveBeenCalledWith(mockStudioSessionSummaries[0].id);
    expect(component.activeReadings().length).toBe(mockStudioSessionReadingsResponse.readings.length);
  });

  it('should not reload readings when the same session is validated or updated', () => {
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[0], is_validated: false });
    fixture.detectChanges();

    expect(mockStudioHistoryService.getSessionReadings).toHaveBeenCalledTimes(1);

    // Update session input with same ID (e.g. validated)
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[0], is_validated: true });
    fixture.detectChanges();

    // Should still only have been called once!
    expect(mockStudioHistoryService.getSessionReadings).toHaveBeenCalledTimes(1);

    // Updating to a different session ID should reload
    fixture.componentRef.setInput('session', mockStudioSessionSummaries[1]);
    fixture.detectChanges();

    expect(mockStudioHistoryService.getSessionReadings).toHaveBeenCalledTimes(2);
  });

  it('should emit sessionConfirmed when confirmSession is called successfully', () => {
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[0], is_validated: false });
    fixture.detectChanges();

    let confirmedSession = null;
    component.sessionConfirmed.subscribe((s) => (confirmedSession = s));

    component.confirmSession();

    expect(mockStudioHistoryService.confirmSession).toHaveBeenCalledWith(mockStudioSessionSummaries[0].id);
    expect(mockToastService.success).toHaveBeenCalled();
    expect(confirmedSession).not.toBeNull();
  });

  it('should handle confirmSession error gracefully', () => {
    mockStudioHistoryService.confirmSession.and.returnValue(throwError(() => ({ error: { detail: 'Error' } })));
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[0], is_validated: false });
    fixture.detectChanges();

    component.confirmSession();

    expect(component.isValidatingSession()).toBeFalse();
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should update label and emit sessionUpdated', () => {
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[0], is_validated: false });
    fixture.detectChanges();

    component.labelEditMode.set('predefined');
    component.editLabelValue.set('run');

    let updatedSession = null;
    component.sessionUpdated.subscribe((s) => (updatedSession = s));

    component.updateLabel();

    expect(mockStudioHistoryService.updateSessionLabel).toHaveBeenCalledWith(mockStudioSessionSummaries[0].id, 'run');
    expect(mockToastService.success).toHaveBeenCalled();
    expect(updatedSession).not.toBeNull();
  });

  it('shows the trim control only for unvalidated sessions', () => {
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[1], is_validated: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="trim-session-control"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="trim-start-slider"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="trim-end-slider"]')).not.toBeNull();

    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[0], is_validated: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="trim-session-control"]')).toBeNull();
  });

  it('trims the session, updates readings and emits the updated summary', () => {
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[1], is_validated: false });
    fixture.detectChanges();
    component.onTrimStartChanged(0.4);
    component.onTrimEndChanged(1.0);
    let updatedSession = null;
    component.sessionUpdated.subscribe((session) => (updatedSession = session));

    component.trimSession();

    expect(mockStudioService.trimSession).toHaveBeenCalledWith(
      mockStudioSessionSummaries[1].id,
      0.4,
      1.0
    );
    expect(component.activeReadings().length).toBe(2);
    expect(component.trimStartOffsetSec()).toBe(0);
    expect(component.trimEndOffsetSec()).toBe(0.6);
    expect(component.trimDurationSec()).toBe(0.6);
    expect(component.replayPlaybackTime()).toBe(0.6);
    expect(updatedSession).toEqual(
      jasmine.objectContaining({ duration_sec: 0.6, sample_count: 2 })
    );
    expect(mockToastService.success).toHaveBeenCalledWith('studio_history.trim_success');
  });

  it('keeps a minimum interval between the two trim cursors', () => {
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[1], is_validated: false });
    fixture.detectChanges();

    component.onTrimEndChanged(1.0);
    component.onTrimStartChanged(0.8);

    expect(component.trimEndOffsetSec() - component.trimStartOffsetSec()).toBeGreaterThanOrEqual(0.6);
  });

  it('reverts a validated session to pending and emits the updated summary', () => {
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[0], is_validated: true });
    fixture.detectChanges();
    let updatedSession = null;
    component.sessionUpdated.subscribe((session) => (updatedSession = session));

    component.reopenSession();

    expect(mockStudioHistoryService.updateSessionValidation).toHaveBeenCalledWith(
      mockStudioSessionSummaries[0].id,
      false
    );
    expect(updatedSession).toEqual(jasmine.objectContaining({ is_validated: false }));
    expect(mockToastService.success).toHaveBeenCalledWith(
      'studio_history.session_unvalidated_success'
    );
  });

  it('should support custom label editing', () => {
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[0], is_validated: false });
    fixture.detectChanges();

    component.labelEditMode.set('custom');
    component.customLabelValue.set('sprint_relay');

    expect(component.effectiveEditLabel()).toBe('sprint_relay');
    expect(component.canSaveLabel()).toBeTrue();

    mockStudioHistoryService.updateSessionLabel.and.returnValue(
      of({ ...mockStudioSessionSummaries[0], label: 'sprint_relay' })
    );

    component.updateLabel();

    expect(mockStudioHistoryService.updateSessionLabel).toHaveBeenCalledWith(
      mockStudioSessionSummaries[0].id,
      'sprint_relay'
    );
  });

  it('should delete session and emit sessionDeleted', () => {
    fixture.componentRef.setInput('session', mockStudioSessionSummaries[0]);
    fixture.detectChanges();

    let deletedId = '';
    component.sessionDeleted.subscribe((id) => (deletedId = id));

    component.confirmDelete();
    expect(component.showDeleteConfirm()).toBeTrue();

    component.deleteSession();

    expect(mockStudioHistoryService.deleteSession).toHaveBeenCalledWith(mockStudioSessionSummaries[0].id);
    expect(mockToastService.info).toHaveBeenCalled();
    expect(deletedId).toBe(mockStudioSessionSummaries[0].id);
  });

  it('should emit previous, next, and close events', () => {
    let prevEmitted = false;
    let nextEmitted = false;
    let closeEmitted = false;

    component.previous.subscribe(() => (prevEmitted = true));
    component.next.subscribe(() => (nextEmitted = true));
    component.close.subscribe(() => (closeEmitted = true));

    component.previous.emit();
    component.next.emit();
    component.close.emit();

    expect(prevEmitted).toBeTrue();
    expect(nextEmitted).toBeTrue();
    expect(closeEmitted).toBeTrue();
  });

  it('should copy share link to clipboard', fakeAsync(() => {
    fixture.componentRef.setInput('session', mockStudioSessionSummaries[0]);
    fixture.detectChanges();

    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

    component.copyShareLink();
    tick();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(jasmine.stringMatching('/dashboard/studio/history/'));
    expect(component.linkCopied()).toBeTrue();
    expect(mockToastService.success).toHaveBeenCalled();
  }));

  it('should trigger JSON export and show toast notification', () => {
    fixture.componentRef.setInput('session', mockStudioSessionSummaries[0]);
    fixture.detectChanges();

    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
    spyOn(URL, 'revokeObjectURL').and.stub();

    component.exportJson();

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it('should show warning if exporting with no telemetry readings', () => {
    mockStudioHistoryService.getSessionReadings.and.returnValue(of({
      device_id: 'hk-dev-1',
      session_id: 'sess-001',
      sample_count: 0,
      readings: [],
    }));

    fixture.componentRef.setInput('session', mockStudioSessionSummaries[0]);
    fixture.detectChanges();

    component.activeReadings.set([]);
    component.exportJson();

    expect(mockToastService.info).toHaveBeenCalled();
  });

  it('should render experimental tag and purple styling for custom activity session', () => {
    const customSession = {
      ...mockStudioSessionSummaries[0],
      id: 'sess-custom-001',
      label: 'moonwalk',
      is_validated: false,
    };

    fixture.componentRef.setInput('session', customSession);
    fixture.detectChanges();

    expect(component.isCustomStudioLabel('moonwalk')).toBeTrue();
    expect(component.getLabelIcon('moonwalk')).toBe('🧪');
    expect(component.getLabelBadgeClass('moonwalk')).toContain('purple');

    const compiled = fixture.nativeElement as HTMLElement;
    const customBadge = compiled.querySelector('[data-testid="inspection-badge-custom"]');
    expect(customBadge).toBeTruthy();
    expect(customBadge?.textContent).toContain('🧪');

    const customNote = compiled.querySelector('[data-testid="inspection-custom-note"]');
    expect(customNote).toBeTruthy();
  });

  it('should update replayPlaybackTime when onReplayTimeSelected is called', () => {
    expect(component.replayPlaybackTime()).toBe(0);
    component.onReplayTimeSelected(1.25);
    expect(component.replayPlaybackTime()).toBe(1.25);
  });

  it('should toggle 3D shoe viewer expansion panel on button click', () => {
    fixture.componentRef.setInput('session', mockStudioSessionSummaries[0]);
    fixture.detectChanges();

    expect(component.show3dViewer()).toBeFalse();
    let compiled = fixture.nativeElement as HTMLElement;
    const shoe3dPanel = compiled.querySelector('[data-testid="shoe-3d-panel"]');
    expect(shoe3dPanel).not.toBeNull();
    expect(shoe3dPanel?.classList.contains('mt-6')).toBeTrue();
    expect(compiled.querySelector('app-shoe-3d-viewer')).toBeNull();

    const toggleBtn = compiled.querySelector('[data-testid="toggle-3d-viewer-btn"]') as HTMLButtonElement;
    expect(toggleBtn).not.toBeNull();
    toggleBtn.click();
    fixture.detectChanges();

    expect(component.show3dViewer()).toBeTrue();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-shoe-3d-viewer')).not.toBeNull();
    expect(compiled.querySelector('[data-testid="shoe-3d-content"]')).not.toBeNull();

    toggleBtn.click();
    fixture.detectChanges();

    expect(component.show3dViewer()).toBeFalse();
    expect(compiled.querySelector('app-shoe-3d-viewer')).toBeNull();
  });

  it('should render isb-guide component in inspection view', () => {
    fixture.componentRef.setInput('session', mockStudioSessionSummaries[0]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-isb-guide')).not.toBeNull();
  });

  it('should prevent label editing and display locked banner when session is validated', () => {
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[0], is_validated: true });
    fixture.detectChanges();

    component.labelEditMode.set('predefined');
    component.editLabelValue.set('run');

    expect(component.canSaveLabel()).toBeFalse();

    component.updateLabel();
    expect(mockStudioHistoryService.updateSessionLabel).not.toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    const lockedBanner = compiled.querySelector('[data-testid="label-locked-banner"]');
    expect(lockedBanner).toBeTruthy();

    const updateBtn = compiled.querySelector('#update-label-btn');
    expect(updateBtn).toBeNull();
  });

  it('should allow label editing and hide locked banner when session is unvalidated', () => {
    fixture.componentRef.setInput('session', { ...mockStudioSessionSummaries[0], is_validated: false });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const lockedBanner = compiled.querySelector('[data-testid="label-locked-banner"]');
    expect(lockedBanner).toBeNull();

    const updateBtn = compiled.querySelector('#update-label-btn');
    expect(updateBtn).toBeTruthy();
  });
});
