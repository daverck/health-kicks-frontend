import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioModelsClassMetricsComponent } from './studio-models-class-metrics.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

describe('StudioModelsClassMetricsComponent', () => {
  let component: StudioModelsClassMetricsComponent;
  let fixture: ComponentFixture<StudioModelsClassMetricsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioModelsClassMetricsComponent, TranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioModelsClassMetricsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('classMetrics', {
      walk: { precision: 0.95, recall: 0.96, f1_score: 0.955, support_windows: 300 },
    });
    fixture.detectChanges();
  });

  it('should render sorted class rows', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('walk');
    expect(fixture.nativeElement.textContent).toContain('95.5%');
  });
});
