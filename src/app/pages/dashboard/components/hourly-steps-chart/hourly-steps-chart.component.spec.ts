import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HourlyStepsChartComponent } from './hourly-steps-chart.component';
import { StepsService } from '../../../../core/services/steps.service';
import { of, throwError } from 'rxjs';
import { HourlyStepsResponse } from '../../../../models/steps.models';

describe('HourlyStepsChartComponent', () => {
  let component: HourlyStepsChartComponent;
  let fixture: ComponentFixture<HourlyStepsChartComponent>;
  let stepsServiceSpy: jasmine.SpyObj<StepsService>;

  const mockResponse: HourlyStepsResponse = {
    device_id: 'HK-2',
    date: '2026-10-11',
    hourly_data: [
      { hour: 8, total_steps: 120, by_activity: { walk: 100, stairs: 20 } },
      { hour: 9, total_steps: 180, by_activity: { walk: 150, run: 30 } },
      { hour: 18, total_steps: 250, by_activity: { walk: 200, stairs: 50 } },
    ],
  };

  beforeEach(async () => {
    stepsServiceSpy = jasmine.createSpyObj('StepsService', ['getHourlySteps']);
    stepsServiceSpy.getHourlySteps.and.returnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [HourlyStepsChartComponent],
      providers: [{ provide: StepsService, useValue: stepsServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(HourlyStepsChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('deviceId', 'HK-2');
    fixture.componentRef.setInput('date', '2026-10-11');
  });

  it('should create the component and fetch hourly steps', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(stepsServiceSpy.getHourlySteps).toHaveBeenCalledWith('HK-2', '2026-10-11');
    expect(component.hourlyData().length).toBe(3);
    expect(component.totalDaySteps()).toBe(550);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeFalse();
  });

  it('should format the date properly in French', () => {
    fixture.detectChanges();

    const formatted = component.formattedDate();
    expect(formatted.toLowerCase()).toContain('2026');
    expect(formatted.toLowerCase()).toContain('octobre');
  });

  it('should handle zero steps gracefully', () => {
    const emptyResponse: HourlyStepsResponse = {
      device_id: 'HK-1',
      date: '2026-10-11',
      hourly_data: [],
    };
    stepsServiceSpy.getHourlySteps.and.returnValue(of(emptyResponse));

    fixture.componentRef.setInput('deviceId', 'HK-1');
    fixture.detectChanges();

    expect(component.totalDaySteps()).toBe(0);
    expect(component.hourlyData().length).toBe(0);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeFalse();
  });

  it('should handle error when fetching hourly data fails', () => {
    stepsServiceSpy.getHourlySteps.and.returnValue(throwError(() => new Error('Network error')));

    component.fetchHourlyData('HK-2', '2026-10-11');
    fixture.detectChanges();

    expect(component.error()).toBeTrue();
    expect(component.loading()).toBeFalse();
    expect(component.totalDaySteps()).toBe(0);
    expect(component.hourlyData()).toEqual([]);
  });

  it('should destroy chart on ngOnDestroy', () => {
    fixture.detectChanges();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});

