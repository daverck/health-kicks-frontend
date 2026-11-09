import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudioClassesStore } from './studio-classes.store';
import { StudioService } from '../../core/services/studio.service';
import {
  StudioClassesSummaryResponse,
  StudioClassDetailStatsResponse,
} from '../../models/telemetry.models';

describe('StudioClassesStore', () => {
  let store: StudioClassesStore;
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
      { date: '2026-09-15', count: 2, validated_count: 2, pending_count: 0 },
      { date: '2026-10-30', count: 5, validated_count: 4, pending_count: 1 },
      { date: '2026-10-31', count: 8, validated_count: 6, pending_count: 2 },
    ],
    confusion_matrix: {
      labels: ['walk', 'idle'],
      matrix: [
        [0.96, 0.04],
        [0.09, 0.91],
      ],
    },
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

  beforeEach(() => {
    studioServiceMock = {
      getClassesSummary: vi.fn().mockReturnValue(of(mockSummary)),
      getClassStats: vi.fn().mockReturnValue(of(mockClassStats)),
    };

    TestBed.configureTestingModule({
      providers: [
        StudioClassesStore,
        { provide: StudioService, useValue: studioServiceMock },
      ],
    });

    store = TestBed.inject(StudioClassesStore);
  });

  it('should initialize with default states', () => {
    expect(store.isLoading()).toBe(true);
    expect(store.error()).toBeNull();
    expect(store.summary()).toBeNull();
    expect(store.selectedClass()).toBeNull();
    expect(store.chartMetric()).toBe('distribution');
    expect(store.isChartExpanded()).toBe(false);
    expect(store.isTableExpanded()).toBe(false);
    expect(store.isMatrixExpanded()).toBe(false);
    expect(store.isTimelineExpanded()).toBe(true);
    expect(store.timelineMode()).toBe('all');
  });

  it('should load summary successfully and compute derived metrics', () => {
    store.loadSummary();

    expect(studioServiceMock.getClassesSummary).toHaveBeenCalled();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.summary()).toEqual(mockSummary);
    expect(store.classes().length).toBe(2);
    expect(store.sortedClasses()[0].label).toBe('walk');
    expect(store.availableMonths()).toEqual(['2026-09', '2026-10']);
    expect(store.selectedMonth()).toBe('2026-10');
  });

  it('should handle summary loading failure gracefully', () => {
    studioServiceMock.getClassesSummary.mockReturnValue(
      throwError(() => ({ error: { detail: 'Server unavailable' } }))
    );

    store.loadSummary();

    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBe('Server unavailable');
  });

  it('should manage class selection and load class stats', () => {
    store.loadSummary();
    store.setSelectedClass('walk');

    expect(store.selectedClass()).toBe('walk');
    expect(studioServiceMock.getClassStats).toHaveBeenCalledWith('walk');
    expect(store.selectedClassStats()).toEqual(mockClassStats);
    expect(store.selectedClassSummary()?.label).toBe('walk');

    // Deselect class
    store.setSelectedClass(null);
    expect(store.selectedClass()).toBeNull();
    expect(store.selectedClassStats()).toBeNull();
    expect(store.selectedClassSummary()).toBeNull();
  });

  it('should toggle expansion panels and metrics correctly', () => {
    store.toggleChartExpansion();
    expect(store.isChartExpanded()).toBe(true);

    store.toggleTableExpansion();
    expect(store.isTableExpanded()).toBe(true);

    store.toggleMatrixExpansion();
    expect(store.isMatrixExpanded()).toBe(true);

    store.toggleTimelineExpansion();
    expect(store.isTimelineExpanded()).toBe(false);

    store.setChartMetric('f1');
    expect(store.chartMetric()).toBe('f1');
  });

  it('should manage confusion matrix hovered cell state', () => {
    expect(store.hoveredCell()).toBeNull();

    store.setHoveredCell('walk', 'idle', 0.04);
    expect(store.hoveredCell()).toEqual({
      trueLabel: 'walk',
      predLabel: 'idle',
      value: 0.04,
    });

    store.clearHoveredCell();
    expect(store.hoveredCell()).toBeNull();
  });

  it('should navigate through timeline months', () => {
    store.loadSummary();
    store.setTimelineMode('month');

    expect(store.selectedMonth()).toBe('2026-10');
    expect(store.currentMonthIndex()).toBe(1);
    expect(store.hasPreviousMonth()).toBe(true);
    expect(store.hasNextMonth()).toBe(false);

    store.goToPreviousMonth();
    expect(store.selectedMonth()).toBe('2026-09');
    expect(store.hasPreviousMonth()).toBe(false);
    expect(store.hasNextMonth()).toBe(true);

    store.goToNextMonth();
    expect(store.selectedMonth()).toBe('2026-10');

    store.selectMonth('2026-09');
    expect(store.selectedMonth()).toBe('2026-09');
  });
});
