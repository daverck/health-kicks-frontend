import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioModelsHistoryTableComponent } from './studio-models-history-table.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

describe('StudioModelsHistoryTableComponent', () => {
  let component: StudioModelsHistoryTableComponent;
  let fixture: ComponentFixture<StudioModelsHistoryTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioModelsHistoryTableComponent, TranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioModelsHistoryTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('models', [
      {
        version: 'v1.2.0',
        model_name: 'RandomForest_Standard',
        created_at: '2026-11-20T10:00:00Z',
        is_active: true,
        git_commit: 'a1b2c3d',
        f1_macro: 0.932,
        accuracy: 0.945,
        precision_macro: 0.938,
        recall_macro: 0.927,
        total_sessions: 42,
        total_windows: 1250,
      },
    ]);
    fixture.detectChanges();
  });

  it('should render table rows', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('v1.2.0');
  });
});
