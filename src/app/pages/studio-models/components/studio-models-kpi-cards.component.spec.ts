import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioModelsKpiCardsComponent } from './studio-models-kpi-cards.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

describe('StudioModelsKpiCardsComponent', () => {
  let component: StudioModelsKpiCardsComponent;
  let fixture: ComponentFixture<StudioModelsKpiCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioModelsKpiCardsComponent, TranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioModelsKpiCardsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('kpis', {
      version: 'v1.2.0',
      modelName: 'RandomForest_Standard',
      isActive: true,
      gitCommit: 'a1b2c3d',
      createdAt: '2026-11-20T10:00:00Z',
      f1Macro: 0.932,
      accuracy: 0.945,
      precisionMacro: 0.938,
      recallMacro: 0.927,
      totalWindows: 1250,
      totalSessions: 42,
      flashUsagePct: 1.25,
      ramUsagePct: 6.4,
      cHeaderSizeBytes: 38450,
      isTargetF1Met: true,
    });
    fixture.detectChanges();
  });

  it('should render kpis accurately', () => {
    expect(component).toBeTruthy();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('v1.2.0');
    expect(text).toContain('93.2%');
  });
});
