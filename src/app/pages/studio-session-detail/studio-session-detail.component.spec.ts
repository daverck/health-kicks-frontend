import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioSessionDetailComponent } from './studio-session-detail.component';
import { StudioHistoryService } from '../../core/services/studio-history.service';
import { TranslationService } from '../../core/services/translation.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { mockStudioSessionSummaries } from '../../../testing/mocks/studio-history.mock';
import { mockStudioSessionReadingsResponse } from '../../../testing/mocks/telemetry.mock';

describe('StudioSessionDetailComponent', () => {
  let component: StudioSessionDetailComponent;
  let fixture: ComponentFixture<StudioSessionDetailComponent>;
  let mockStudioHistoryService: jasmine.SpyObj<StudioHistoryService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let router: Router;

  beforeEach(async () => {
    mockStudioHistoryService = jasmine.createSpyObj('StudioHistoryService', [
      'getSession',
      'getSessionReadings',
      'confirmSession',
      'updateSessionLabel',
      'deleteSession',
    ]);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((k: string) => k);

    mockStudioHistoryService.getSession.and.returnValue(of(mockStudioSessionSummaries[0]));
    mockStudioHistoryService.getSessionReadings.and.returnValue(of(mockStudioSessionReadingsResponse));

    await TestBed.configureTestingModule({
      imports: [StudioSessionDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? mockStudioSessionSummaries[0].id : null),
              },
            },
          },
        },
        { provide: StudioHistoryService, useValue: mockStudioHistoryService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(StudioSessionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load session details from route parameter', () => {
    expect(component).toBeTruthy();
    expect(component.sessionId()).toBe(mockStudioSessionSummaries[0].id);
    expect(mockStudioHistoryService.getSession).toHaveBeenCalledWith(mockStudioSessionSummaries[0].id);
    expect(component.session()).toEqual(mockStudioSessionSummaries[0]);
    expect(component.isLoading()).toBeFalse();
  });

  it('should display error message when session is not found', () => {
    mockStudioHistoryService.getSession.and.returnValue(throwError(() => ({ status: 404 })));
    component.loadSession('unknown-id');

    expect(component.isLoading()).toBeFalse();
    expect(component.errorMessage()).toBe('studio_history.session_not_found_desc');
  });

  it('should navigate back to history on goBack() or onSessionDeleted()', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/studio/history']);

    component.onSessionDeleted();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/studio/history']);
  });

  it('should update session when onSessionUpdated or onSessionConfirmed is called', () => {
    const updated = { ...mockStudioSessionSummaries[0], label: 'running' };
    component.onSessionUpdated(updated);
    expect(component.session()?.label).toBe('running');

    const confirmed = { ...mockStudioSessionSummaries[0], is_validated: true };
    component.onSessionConfirmed(confirmed);
    expect(component.session()?.is_validated).toBeTrue();
  });
});
