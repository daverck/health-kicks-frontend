import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioClassDetailComponent } from './studio-class-detail.component';
import { StudioService } from '../../core/services/studio.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { StudioClassDetailStatsResponse } from '../../models/telemetry.models';

describe('StudioClassDetailComponent', () => {
  let component: StudioClassDetailComponent;
  let fixture: ComponentFixture<StudioClassDetailComponent>;
  let mockStudioService: { getClassStats: any };

  const mockStats: StudioClassDetailStatsResponse = {
    label: 'walk',
    total_sessions: 42,
    validated_sessions: 35,
    pending_sessions: 7,
    duration_metrics: {
      median_sec: 5.0,
      mean_sec: 5.25,
      std_sec: 1.12,
      min_sec: 3.0,
      max_sec: 10.0,
    },
    ml_metrics: {
      precision: 0.9754,
      recall: 0.9876,
      f1_score: 0.9815,
      support_windows: 643,
    },
    daily_counts: [
      { date: '2026-10-25', count: 20, validated_count: 18, pending_count: 2 },
      { date: '2026-10-26', count: 22, validated_count: 17, pending_count: 5 },
    ],
  };

  beforeEach(async () => {
    mockStudioService = {
      getClassStats: vi.fn().mockReturnValue(of(mockStats)),
    };

    await TestBed.configureTestingModule({
      imports: [StudioClassDetailComponent],
      providers: [
        { provide: StudioService, useValue: mockStudioService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['label', 'walk']])),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioClassDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load class stats on init', () => {
    expect(component).toBeTruthy();
    expect(component.label()).toBe('walk');
    expect(mockStudioService.getClassStats).toHaveBeenCalledWith('walk');
    expect(component.stats()).toEqual(mockStats);
    expect(component.loading()).toBe(false);
  });

  it('should compute formatted precision, recall and F1 percentages', () => {
    expect(component.precisionPct()).toBe('97.5');
    expect(component.recallPct()).toBe('98.8');
    expect(component.f1Pct()).toBe('98.2');
  });

  it('should render KPI cards and class summary in template', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('walk');
    expect(el.textContent).toContain('42 sessions');
    expect(el.textContent).toContain('97.5%');
    expect(el.textContent).toContain('98.8%');
    expect(el.textContent).toContain('5 s');
  });

  it('should handle service error gracefully', () => {
    mockStudioService.getClassStats.mockReturnValue(throwError(() => new Error('Network error')));
    component.loadStats('walk');
    fixture.detectChanges();

    expect(component.error()).toBe('Network error');
    expect(component.loading()).toBe(false);
  });
});

