import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StudioClassesKpiCardsComponent } from './studio-classes-kpi-cards.component';

describe('StudioClassesKpiCardsComponent', () => {
  let component: StudioClassesKpiCardsComponent;
  let fixture: ComponentFixture<StudioClassesKpiCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioClassesKpiCardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioClassesKpiCardsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('totalClasses', 4);
    fixture.componentRef.setInput('totalSessions', 40);
    fixture.componentRef.setInput('validatedSessions', 32);
    fixture.componentRef.setInput('pendingSessions', 8);
    fixture.componentRef.setInput('macroPrecision', 0.92);
    fixture.componentRef.setInput('macroRecall', 0.88);
    fixture.componentRef.setInput('macroF1', 0.90);
    fixture.componentRef.setInput('formatScore', (val: number | null | undefined) =>
      val != null ? `${(val * 100).toFixed(1)}%` : '—'
    );

    fixture.detectChanges();
  });

  it('should render 5 KPI cards with formatted values', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('4');
    expect(compiled.textContent).toContain('40');
    expect(compiled.textContent).toContain('32');
    expect(compiled.textContent).toContain('8');
    expect(compiled.textContent).toContain('92.0%');
    expect(compiled.textContent).toContain('88.0%');
    expect(compiled.textContent).toContain('90.0%');
  });
});
