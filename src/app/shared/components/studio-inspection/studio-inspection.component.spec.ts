import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StudioInspectionComponent } from './studio-inspection.component';
import { StudioHistoryService } from '../../../core/services/studio-history.service';
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
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockStudioHistoryService = jasmine.createSpyObj('StudioHistoryService', [
      'getSessionReadings',
      'confirmSession',
      'updateSessionLabel',
      'deleteSession',
    ]);
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

    await TestBed.configureTestingModule({
      imports: [StudioInspectionComponent],
      providers: [
        provideRouter([]),
        { provide: StudioHistoryService, useValue: mockStudioHistoryService },
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
    fixture.componentRef.setInput('session', mockStudioSessionSummaries[0]);
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

  it('should support custom label editing', () => {
    fixture.componentRef.setInput('session', mockStudioSessionSummaries[0]);
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
});
