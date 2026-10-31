import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudioClassesComponent } from './studio-classes.component';
import { StudioService } from '../../core/services/studio.service';
import { StudioClassesSummaryResponse } from '../../models/telemetry.models';

describe('StudioClassesComponent', () => {
  let component: StudioClassesComponent;
  let fixture: ComponentFixture<StudioClassesComponent>;
  let studioServiceMock: { getClassesSummary: ReturnType<typeof vi.fn> };

  const mockSummary: StudioClassesSummaryResponse = {
    total_classes: 2,
    total_sessions: 15,
    validated_sessions: 12,
    pending_sessions: 3,
    total_duration_sec: 75.0,
    macro_precision: 0.952,
    macro_recall: 0.941,
    macro_f1: 0.946,
    classes: [
      {
        label: 'walk',
        total_sessions: 10,
        validated_sessions: 8,
        pending_sessions: 2,
        total_duration_sec: 50.0,
        median_duration_sec: 5.0,
        latest_session_date: '2026-10-31',
        precision: 0.98,
        recall: 0.96,
        f1_score: 0.97,
        support_windows: 240,
      },
      {
        label: 'idle',
        total_sessions: 5,
        validated_sessions: 4,
        pending_sessions: 1,
        total_duration_sec: 25.0,
        median_duration_sec: 5.0,
        latest_session_date: '2026-10-30',
        precision: 0.92,
        recall: 0.91,
        f1_score: 0.915,
        support_windows: 120,
      },
    ],
  };

  beforeEach(async () => {
    studioServiceMock = {
      getClassesSummary: vi.fn().mockReturnValue(of(mockSummary)),
    };

    await TestBed.configureTestingModule({
      imports: [StudioClassesComponent],
      providers: [
        provideRouter([]),
        { provide: StudioService, useValue: studioServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioClassesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load classes summary on init', () => {
    expect(component).toBeTruthy();
    expect(studioServiceMock.getClassesSummary).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.summary()?.total_classes).toBe(2);
  });

  it('should render total sessions and macro ML performance cards', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('15');
    expect(el.textContent).toContain('95.2%');
    expect(el.textContent).toContain('94.1%');
  });

  it('should list all classes in the comparison table', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('WALK');
    expect(el.textContent).toContain('IDLE');
    expect(el.textContent).toContain('98.0%');
    expect(el.textContent).toContain('96.0%');
  });

  it('should provide links to class detail pages', () => {
    const el: HTMLElement = fixture.nativeElement;
    const detailLinks = el.querySelectorAll('a[href*="/dashboard/studio/classes/"]');
    expect(detailLinks.length).toBeGreaterThanOrEqual(2);
  });
});
