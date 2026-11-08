import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudioClassesConfusionMatrixComponent } from './studio-classes-confusion-matrix.component';
import { StudioConfusionMatrix } from '../../../models/telemetry.models';

describe('StudioClassesConfusionMatrixComponent', () => {
  let component: StudioClassesConfusionMatrixComponent;
  let fixture: ComponentFixture<StudioClassesConfusionMatrixComponent>;

  const mockMatrix: StudioConfusionMatrix = {
    labels: ['walk', 'idle'],
    matrix: [
      [0.96, 0.04],
      [0.09, 0.91],
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioClassesConfusionMatrixComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioClassesConfusionMatrixComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('confusionMatrix', mockMatrix);
    fixture.componentRef.setInput('isMatrixExpanded', true);
    fixture.componentRef.setInput('hoveredCell', null);
    fixture.componentRef.setInput('formatLabel', (lbl: string) => lbl.toUpperCase());
    fixture.componentRef.setInput('getCellBgClass', (val: number) => (val >= 0.9 ? 'bg-emerald-600' : 'bg-red-100'));

    fixture.detectChanges();
  });

  it('should render confusion matrix panel and cells', () => {
    expect(component).toBeTruthy();
    const panel = fixture.nativeElement.querySelector('[data-testid="confusion-matrix-panel"]');
    expect(panel).toBeTruthy();

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells.length).toBe(4);
    expect(cells[0].textContent).toContain('96%');
  });

  it('should emit cellHover on mouseenter and clearHover on mouseleave', () => {
    const hoverSpy = vi.fn();
    const clearSpy = vi.fn();
    component.cellHover.subscribe(hoverSpy);
    component.clearHover.subscribe(clearSpy);

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    cells[0].dispatchEvent(new MouseEvent('mouseenter'));
    expect(hoverSpy).toHaveBeenCalledWith({ trueLabel: 'walk', predLabel: 'walk', value: 0.96 });

    cells[0].dispatchEvent(new MouseEvent('mouseleave'));
    expect(clearSpy).toHaveBeenCalled();
  });
});
