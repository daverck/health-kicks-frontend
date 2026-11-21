import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StudioModelsStore } from './studio-models.store';
import { StudioService } from '../../core/services/studio.service';
import { MLModelDetailResponse, MLModelSummaryResponse } from '../../models/telemetry.models';

describe('StudioModelsStore', () => {
  let store: StudioModelsStore;
  let studioServiceMock: jasmine.SpyObj<StudioService>;

  const mockModels: MLModelSummaryResponse[] = [
    {
      version: 'v1.2.0',
      model_name: 'RandomForest_Standard',
      created_at: '2026-11-20T10:00:00Z',
      is_active: true,
      git_commit: 'commit123',
      f1_macro: 0.932,
      accuracy: 0.945,
      precision_macro: 0.938,
      recall_macro: 0.927,
      total_sessions: 42,
      total_windows: 1250,
    },
    {
      version: 'v1.1.0',
      model_name: 'RandomForest_Standard',
      created_at: '2026-11-10T10:00:00Z',
      is_active: false,
      git_commit: 'commit456',
      f1_macro: 0.891,
      accuracy: 0.902,
      precision_macro: 0.895,
      recall_macro: 0.887,
      total_sessions: 30,
      total_windows: 900,
    },
  ];

  const mockDetail120: MLModelDetailResponse = {
    version: 'v1.2.0',
    model_name: 'RandomForest_Standard',
    created_at: '2026-11-20T10:00:00Z',
    is_active: true,
    git_commit: 'commit123',
    window_size_sec: 3.0,
    window_step_sec: 0.5,
    flash_usage_pct: 1.25,
    ram_usage_pct: 6.4,
    c_header_size_bytes: 38450,
    metrics: {
      f1_macro: 0.932,
      accuracy: 0.945,
      precision_macro: 0.938,
      recall_macro: 0.927,
      class_metrics: {
        walk: { precision: 0.95, recall: 0.96, f1_score: 0.955, support_windows: 300 },
      },
    },
  };

  const mockDetail110: MLModelDetailResponse = {
    version: 'v1.1.0',
    model_name: 'RandomForest_Standard',
    created_at: '2026-11-10T10:00:00Z',
    is_active: false,
    git_commit: 'commit456',
    window_size_sec: 3.0,
    window_step_sec: 0.5,
    flash_usage_pct: 1.15,
    ram_usage_pct: 6.1,
    c_header_size_bytes: 35000,
    metrics: {
      f1_macro: 0.891,
      accuracy: 0.902,
      precision_macro: 0.895,
      recall_macro: 0.887,
      class_metrics: {
        walk: { precision: 0.91, recall: 0.92, f1_score: 0.915, support_windows: 280 },
      },
    },
  };

  beforeEach(() => {
    studioServiceMock = jasmine.createSpyObj<StudioService>('StudioService', [
      'getModelsHistory',
      'getModelDetail',
    ]);
    studioServiceMock.getModelsHistory.and.returnValue(of(mockModels));
    studioServiceMock.getModelDetail.and.returnValue(of(mockDetail120));

    TestBed.configureTestingModule({
      providers: [
        StudioModelsStore,
        { provide: StudioService, useValue: studioServiceMock },
      ],
    });

    store = TestBed.inject(StudioModelsStore);
  });

  it('should initialize with default states', () => {
    expect(store.models()).toEqual([]);
    expect(store.selectedVersion()).toBeNull();
    expect(store.comparatorVersion()).toBeNull();
    expect(store.isLoading()).toBeTrue();
  });

  it('should load history and auto-select active champion model', () => {
    studioServiceMock.getModelsHistory.and.returnValue(of(mockModels));
    studioServiceMock.getModelDetail.and.returnValue(of(mockDetail120));

    store.loadHistory();

    expect(store.models().length).toBe(2);
    expect(store.championModel()?.version).toBe('v1.2.0');
    expect(store.selectedVersion()).toBe('v1.2.0');
    expect(store.selectedModelDetail()).toEqual(mockDetail120);
    expect(store.kpis().f1Macro).toBe(0.932);
    expect(store.kpis().isTargetF1Met).toBeTrue();
  });

  it('should load comparator and compute comparison deltas', () => {
    studioServiceMock.getModelsHistory.and.returnValue(of(mockModels));
    studioServiceMock.getModelDetail.and.callFake((v: string) => {
      if (v === 'v1.1.0') return of(mockDetail110);
      return of(mockDetail120);
    });

    store.loadHistory();
    store.setComparatorVersion('v1.1.0');

    expect(store.comparatorVersion()).toBe('v1.1.0');
    expect(store.comparatorModelDetail()).toEqual(mockDetail110);

    const deltas = store.comparisonDeltas();
    expect(deltas).not.toBeNull();
    expect(deltas?.deltaF1).toBeCloseTo(-0.041, 3);
    expect(deltas?.deltaAccuracy).toBeCloseTo(-0.043, 3);
  });

  it('should clear comparator when requested', () => {
    studioServiceMock.getModelDetail.and.returnValue(of(mockDetail110));
    store.setComparatorVersion('v1.1.0');
    store.clearComparator();

    expect(store.comparatorVersion()).toBeNull();
    expect(store.comparatorModelDetail()).toBeNull();
    expect(store.comparisonDeltas()).toBeNull();
  });

  it('should handle history loading error', () => {
    studioServiceMock.getModelsHistory.and.returnValue(
      throwError(() => ({ error: { detail: 'Database error' } }))
    );

    store.loadHistory();

    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBe('Database error');
  });
});
