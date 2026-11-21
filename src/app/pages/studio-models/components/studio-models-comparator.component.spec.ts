import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioModelsComparatorComponent } from './studio-models-comparator.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

describe('StudioModelsComparatorComponent', () => {
  let component: StudioModelsComparatorComponent;
  let fixture: ComponentFixture<StudioModelsComparatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioModelsComparatorComponent, TranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioModelsComparatorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('baseModel', {
      version: 'v1.2.0',
      model_name: 'RandomForest_Standard',
      created_at: '2026-11-20T10:00:00Z',
      is_active: true,
      metrics: { f1_macro: 0.932, accuracy: 0.945 },
      flash_usage_pct: 1.25,
      ram_usage_pct: 6.4,
    });
    fixture.componentRef.setInput('compModel', {
      version: 'v1.1.0',
      model_name: 'RandomForest_Standard',
      created_at: '2026-11-10T10:00:00Z',
      is_active: false,
      metrics: { f1_macro: 0.891, accuracy: 0.902 },
      flash_usage_pct: 1.15,
      ram_usage_pct: 6.1,
    });
    fixture.componentRef.setInput('deltas', {
      deltaF1: -0.041,
      deltaAccuracy: -0.043,
      deltaPrecision: -0.043,
      deltaRecall: -0.04,
      deltaFlashPct: -0.1,
      deltaRamPct: -0.3,
      deltaCHeaderBytes: -3450,
      classDeltas: [
        { label: 'walk', baseF1: 0.955, compF1: 0.915, deltaF1: -0.04 },
      ],
    });
    fixture.detectChanges();
  });

  it('should render comparator delta cards', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('-4.10%');
  });
});
