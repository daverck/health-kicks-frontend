import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudioClassesComponent } from './studio-classes.component';
import { StudioService } from '../../core/services/studio.service';
import {
  StudioClassesSummaryResponse,
  StudioClassDetailStatsResponse,
} from '../../models/telemetry.models';

describe('StudioClassesComponent', () => {
  let component: StudioClassesComponent;
  let fixture: ComponentFixture<StudioClassesComponent>;
  let router: Router;
  let studioServiceMock: {
    getClassesSummary: ReturnType<typeof vi.fn>;
    getClassStats: ReturnType<typeof vi.fn>;
  };

  const mockSummary: StudioClassesSummaryResponse = {
    total_classes: 2,
    total_sessions: 15,
    validated_sessions: 12,
    pending_sessions: 3,
    total_duration_sec: 75.0,
    macro_precision: 0.952,
    macro_recall: 0.941,
    macro_f1: 0.946,
    daily_counts: [
      { date: '2026-10-30', count: 5, validated_count: 4, pending_count: 1 },
      { date: '2026-10-31', count: 10, validated_count: 8, pending_count: 2 },
    ],
    classes: [
      {
        label: 'walk',
        total_sessions: 10,
        validated_sessions: 8,
        pending_sessions: 2,
        total_duration_sec: 50.0,
        median_duration_sec: 5.0,
        first_session_date: '2026-10-20',
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
        first_session_date: '2026-10-21',
        latest_session_date: '2026-10-30',
        precision: 0.92,
        recall: 0.91,
        f1_score: 0.915,
        support_windows: 120,
      },
    ],
  };

  const mockClassStats: StudioClassDetailStatsResponse = {
    label: 'walk',
    total_sessions: 10,
    validated_sessions: 8,
    pending_sessions: 2,
    daily_counts: [
      { date: '2026-10-30', count: 3, validated_count: 2, pending_count: 1 },
      { date: '2026-10-31', count: 7, validated_count: 6, pending_count: 1 },
    ],
  };

  beforeEach(async () => {
    studioServiceMock = {
      getClassesSummary: vi.fn().mockReturnValue(of(mockSummary)),
      getClassStats: vi.fn().mockReturnValue(of(mockClassStats)),
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
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should initialize and load classes summary', () => {
    expect(component).toBeTruthy();
    expect(studioServiceMock.getClassesSummary).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.summary()).toEqual(mockSummary);
    expect(component.classes().length).toBe(2);
    expect(component.sortedClasses()[0].label).toBe('walk');
  });

  it('should toggle chart expansion panel', () => {
    expect(component.isChartExpanded()).toBe(false);
    component.toggleChartExpansion();
    expect(component.isChartExpanded()).toBe(true);
    component.toggleChartExpansion();
    expect(component.isChartExpanded()).toBe(false);
  });

  it('should toggle table expansion panel', () => {
    expect(component.isTableExpanded()).toBe(false);
    component.toggleTableExpansion();
    expect(component.isTableExpanded()).toBe(true);
    component.toggleTableExpansion();
    expect(component.isTableExpanded()).toBe(false);
  });

  it('should toggle timeline expansion panel (expanded by default)', () => {
    expect(component.isTimelineExpanded()).toBe(true);
    component.toggleTimelineExpansion();
    expect(component.isTimelineExpanded()).toBe(false);
    component.toggleTimelineExpansion();
    expect(component.isTimelineExpanded()).toBe(true);
  });

  it('should toggle chart metric correctly', () => {
    expect(component.chartMetric()).toBe('distribution');

    component.setChartMetric('f1');
    expect(component.chartMetric()).toBe('f1');

    component.setChartMetric('precision');
    expect(component.chartMetric()).toBe('precision');

    component.setChartMetric('recall');
    expect(component.chartMetric()).toBe('recall');

    component.setChartMetric('distribution');
    expect(component.chartMetric()).toBe('distribution');
  });

  it('should render metric toggle buttons when chart is expanded', () => {
    component.toggleChartExpansion();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metricGroup = compiled.querySelector('[data-testid="metric-toggle-group"]');
    expect(metricGroup).toBeTruthy();

    const distBtn = compiled.querySelector('[data-testid="metric-btn-distribution"]') as HTMLButtonElement;
    const f1Btn = compiled.querySelector('[data-testid="metric-btn-f1"]') as HTMLButtonElement;
    expect(distBtn).toBeTruthy();
    expect(f1Btn).toBeTruthy();

    f1Btn.click();
    expect(component.chartMetric()).toBe('f1');
  });

  it('should select class and navigate with query parameter', () => {
    component.selectClass('walk');
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { class: 'walk' },
      replaceUrl: false,
    });

    component.selectedClass.set('walk');
    component.selectClass('walk');
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: {},
      replaceUrl: false,
    });
  });

  it('should filter timeline by mode and month', () => {
    expect(component.timelineMode()).toBe('all');
    expect(component.filteredDailyCounts().length).toBe(2);

    component.setTimelineMode('month');
    expect(component.timelineMode()).toBe('month');
    expect(component.selectedMonth()).toBe('2026-10');
    expect(component.filteredDailyCounts().length).toBe(2);
  });

  it('should format score with percentage or fallback', () => {
    expect(component.formatScore(0.9523)).toBe('95.2%');
    expect(component.formatScore(null)).toBe('—');
    expect(component.formatScore(undefined)).toBe('—');
    expect(component.formatScore(NaN)).toBe('—');
  });

  it('should format labels by replacing underscores and capitalizing', () => {
    expect(component.formatLabel('fall_backward')).toBe('FALL BACKWARD');
    expect(component.formatLabel('walk')).toBe('WALK');
  });
});
