import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityCalendarComponent } from './activity-calendar.component';
import { StepsService } from '../../../../core/services/steps.service';
import { of, throwError } from 'rxjs';
import { DailyStepsSummary } from '../../../../models/steps.models';

describe('ActivityCalendarComponent', () => {
  let component: ActivityCalendarComponent;
  let fixture: ComponentFixture<ActivityCalendarComponent>;
  let stepsServiceSpy: jasmine.SpyObj<StepsService>;

  const mockSummaries: DailyStepsSummary[] = [
    { date: '2026-10-01', total_steps: 1500, by_activity: { walk: 1500 } },
    { date: '2026-10-02', total_steps: 4500, by_activity: { walk: 4500 } },
    { date: '2026-10-03', total_steps: 8000, by_activity: { walk: 8000 } },
    { date: '2026-10-04', total_steps: 12500, by_activity: { walk: 12500 } },
  ];

  beforeEach(async () => {
    stepsServiceSpy = jasmine.createSpyObj('StepsService', ['getMonthlyStepsSummary']);
    stepsServiceSpy.getMonthlyStepsSummary.and.returnValue(of(mockSummaries));

    await TestBed.configureTestingModule({
      imports: [ActivityCalendarComponent],
      providers: [{ provide: StepsService, useValue: stepsServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityCalendarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('deviceId', 'HK-SHOE-001');
    component.currentYear.set(2026);
    component.currentMonth.set(10);
  });

  it('should create the component and load monthly steps', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(stepsServiceSpy.getMonthlyStepsSummary).toHaveBeenCalledWith('HK-SHOE-001', 2026, 10);
    expect(component.calendarDays().length).toBe(31);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeFalse();
  });

  it('should calculate intensity levels accurately', () => {
    fixture.detectChanges();

    const days = component.calendarDays();
    expect(days[0].level).toBe(0); // 1500 (< 2000)
    expect(days[1].level).toBe(1); // 4500 (2000 - 5999)
    expect(days[2].level).toBe(2); // 8000 (6000 - 9999)
    expect(days[3].level).toBe(3); // 12500 (>= 10000)
  });

  it('should navigate to previous and next month', () => {
    fixture.detectChanges();

    component.prevMonth();
    expect(component.currentMonth()).toBe(9);
    expect(stepsServiceSpy.getMonthlyStepsSummary).toHaveBeenCalledWith('HK-SHOE-001', 2026, 9);

    component.nextMonth();
    expect(component.currentMonth()).toBe(10);
  });

  it('should select a day and emit dateSelected', () => {
    fixture.detectChanges();
    spyOn(component.dateSelected, 'emit');

    component.selectDay('2026-10-04');
    expect(component.selectedDate()).toBe('2026-10-04');
    expect(component.dateSelected.emit).toHaveBeenCalledWith('2026-10-04');
  });

  it('should handle error when loading monthly steps fails', () => {
    stepsServiceSpy.getMonthlyStepsSummary.and.returnValue(throwError(() => new Error('Failed')));

    component.loadMonthlyData();
    fixture.detectChanges();

    expect(component.monthSummaries()).toEqual({});
    expect(component.error()).toBeTrue();
    expect(component.loading()).toBeFalse();
  });
});
