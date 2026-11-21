import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioModelsConfusionMatrixComponent } from './studio-models-confusion-matrix.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

describe('StudioModelsConfusionMatrixComponent', () => {
  let component: StudioModelsConfusionMatrixComponent;
  let fixture: ComponentFixture<StudioModelsConfusionMatrixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioModelsConfusionMatrixComponent, TranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioModelsConfusionMatrixComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('matrixData', {
      labels: ['walk', 'run'],
      matrix: [
        [0.96, 0.04],
        [0.08, 0.92],
      ],
    });
    fixture.detectChanges();
  });

  it('should render matrix cells', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('96%');
    expect(fixture.nativeElement.textContent).toContain('92%');
  });
});
