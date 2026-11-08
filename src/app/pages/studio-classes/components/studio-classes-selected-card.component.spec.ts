import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudioClassesSelectedCardComponent } from './studio-classes-selected-card.component';
import { StudioClassSummaryItem } from '../../../models/telemetry.models';

describe('StudioClassesSelectedCardComponent', () => {
  let component: StudioClassesSelectedCardComponent;
  let fixture: ComponentFixture<StudioClassesSelectedCardComponent>;

  const mockItem: StudioClassSummaryItem = {
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
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioClassesSelectedCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioClassesSelectedCardComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('classItem', mockItem);
    fixture.componentRef.setInput('formatLabel', (lbl: string) => lbl.toUpperCase());
    fixture.componentRef.setInput('formatScore', (val: number | null | undefined) =>
      val != null ? `${(val * 100).toFixed(1)}%` : '—'
    );

    fixture.detectChanges();
  });

  it('should render selected class details and emit close when close button clicked', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('WALK');
    expect(compiled.textContent).toContain('97.0%');
    expect(compiled.textContent).toContain('5 s');

    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    const closeBtn = compiled.querySelector('button') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    expect(closeSpy).toHaveBeenCalled();
  });
});
