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
        first_session_date: '2026-10-15',
        latest_session_date: '2026-10-30',
        precision: 0.92,
        recall: 0.91,
        f1_score: 0.915,
        support_windows: 120,
      },
    ],
  };

  const mockClassStatsWalk: StudioClassDetailStatsResponse = {
    label: 'walk',
    total_sessions: 10,
    validated_sessions: 8,
    pending_sessions: 2,
    first_session_date: '2026-10-20',
    latest_session_date: '2026-10-31',
    duration_metrics: {
      median_sec: 5.0,
      mean_sec: 5.1,
      min_sec: 4.8,
      max_sec: 5.3,
      std_sec: 0.2,
      total_sec: 50.0,
    },
    ml_metrics: {
      precision: 0.98,
      recall: 0.96,
      f1_score: 0.97,
      support_windows: 240,
    },
    daily_counts: [
      { date: '2026-10-31', count: 10, validated_count: 8, pending_count: 2 },
    ],
  };

  beforeEach(async () => {
    studioServiceMock = {
      getClassesSummary: vi.fn().mockReturnValue(of(mockSummary)),
      getClassStats: vi.fn().mockReturnValue(of(mockClassStatsWalk)),
    };

    await TestBed.configureTestingModule({
      imports: [StudioClassesComponent],
      providers: [
        provideRouter([]),
        { provide: StudioService, useValue: studioServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(StudioClassesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load classes summary on init', () => {
    expect(component).toBeTruthy();
    expect(studioServiceMock.getClassesSummary).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.summary()?.total_classes).toBe(2);
    expect(component.activeDailyCounts().length).toBe(2);
  });

  it('should render 5 global KPI cards including Macro F1 score', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Classes Actives');
    expect(el.textContent).toContain('Sessions Totales');
    expect(el.textContent).toContain('Précision Macro ML');
    expect(el.textContent).toContain('Rappel Macro ML');
    expect(el.textContent).toContain('Score F1 Macro ML');
    expect(el.textContent).toContain('15');
    expect(el.textContent).toContain('95.2%');
    expect(el.textContent).toContain('94.1%');
    expect(el.textContent).toContain('94.6%');
  });

  it('should list all classes in the comparison table with metrics and capture dates', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('WALK');
    expect(el.textContent).toContain('IDLE');
    expect(el.textContent).toContain('98.0%');
    expect(el.textContent).toContain('96.0%');
    expect(el.textContent).toContain('97.0%');
    expect(el.textContent).toContain('2026-10-20');
    expect(el.textContent).toContain('2026-10-31');
  });

  it('should hide dedicated class detail summary by default when no class is selected', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(component.selectedClass()).toBeNull();
    expect(el.textContent).toContain('Toutes les classes');
    expect(el.textContent).not.toContain('Statistiques de la classe : walk');
  });

  it('should select class on action click, load its stats and display dedicated summary', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.selectClass('walk');
    expect(navigateSpy).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { class: 'walk' },
      replaceUrl: false,
    });

    component.selectedClass.set('walk');
    component.selectedClassStats.set(mockClassStatsWalk);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Statistiques de la classe : walk');
    expect(component.selectedClass()).toBe('walk');
    expect(component.activeDailyCounts().length).toBe(1);
  });

  it('should deselect class when clicking on the same class or resetting to all classes', () => {
    component.selectedClass.set('walk');
    fixture.detectChanges();

    const navigateSpy = vi.spyOn(router, 'navigate');
    component.selectClass('walk'); // toggle off
    expect(navigateSpy).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: {},
      replaceUrl: false,
    });
  });

  it('should toggle timelineMode between all and month and navigate months', () => {
    expect(component.timelineMode()).toBe('all');
    component.setTimelineMode('month');
    expect(component.timelineMode()).toBe('month');
    expect(component.selectedMonth()).toBe('2026-10');
    expect(component.filteredDailyCounts().length).toBe(2);
  });

  it('should have the distribution bar chart collapsed by default and expand on toggle', () => {
    expect(component.isChartExpanded()).toBe(false);
    const el: HTMLElement = fixture.nativeElement;
    // Canvas is not present initially
    expect(component.chartCanvas()).toBeUndefined();

    const toggleBtn: HTMLButtonElement | null = el.querySelector('[data-testid="toggle-chart-expansion-btn"]');
    expect(toggleBtn).not.toBeNull();

    toggleBtn?.click();
    fixture.detectChanges();

    expect(component.isChartExpanded()).toBe(true);
    expect(component.chartCanvas()).toBeDefined();
  });
});
