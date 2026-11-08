import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudioClassesTableComponent } from './studio-classes-table.component';
import { StudioClassSummaryItem } from '../../../models/telemetry.models';

describe('StudioClassesTableComponent', () => {
  let component: StudioClassesTableComponent;
  let fixture: ComponentFixture<StudioClassesTableComponent>;

  const mockClasses: StudioClassSummaryItem[] = [
    {
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
    },
    {
      label: 'run',
      total_sessions: 5,
      validated_sessions: 4,
      pending_sessions: 1,
      total_duration_sec: 25.0,
      median_duration_sec: 5.0,
      first_session_date: '2026-10-21',
      latest_session_date: '2026-10-30',
      precision: 0.92,
      recall: 0.91,
      f1_score: 0.915,
      support_windows: 120,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioClassesTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioClassesTableComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('classes', mockClasses);
    fixture.componentRef.setInput('selectedClass', null);
    fixture.componentRef.setInput('isTableExpanded', true);
    fixture.componentRef.setInput('formatScore', (val: number | null | undefined) =>
      val != null ? `${(val * 100).toFixed(1)}%` : '—'
    );
    fixture.componentRef.setInput('formatLabel', (lbl: string) => lbl.toUpperCase());

    fixture.detectChanges();
  });

  it('should render table rows and emit selectClass on row click', () => {
    expect(component).toBeTruthy();
    const selectSpy = vi.fn();
    component.selectClass.subscribe(selectSpy);

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    rows[0].click();
    expect(selectSpy).toHaveBeenCalledWith('walk');
  });

  it('should emit toggleExpansion when header button is clicked', () => {
    const toggleSpy = vi.fn();
    component.toggleExpansion.subscribe(toggleSpy);

    const toggleBtn = fixture.nativeElement.querySelector('[data-testid="toggle-table-expansion-btn"]');
    expect(toggleBtn).toBeTruthy();
    toggleBtn.click();
    expect(toggleSpy).toHaveBeenCalled();
  });
});
