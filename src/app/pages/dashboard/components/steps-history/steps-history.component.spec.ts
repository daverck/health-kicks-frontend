import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StepsHistoryComponent } from './steps-history.component';
import { StepsService } from '../../../../core/services/steps.service';
import { DailyStepsHistoryResponse } from '../../../../models/steps.models';
import { SimpleChange } from '@angular/core';

describe('StepsHistoryComponent', () => {
  let component: StepsHistoryComponent;
  let fixture: ComponentFixture<StepsHistoryComponent>;
  let stepsServiceSpy: jasmine.SpyObj<StepsService>;

  const mockHistoryResponse: DailyStepsHistoryResponse = {
    device_id: 'HK-SHOE-001',
    from_date: '2026-08-23',
    to_date: '2026-09-22',
    history: [
      {
        date: '2026-09-21',
        total_steps: 5000,
        by_activity: { walk: 3000, run: 2000 },
      },
      {
        date: '2026-09-22',
        total_steps: 10000,
        by_activity: { walk: 6000, run: 3000, stairs: 1000 },
      },
    ],
  };

  beforeEach(async () => {
    stepsServiceSpy = jasmine.createSpyObj('StepsService', ['getStepsHistory']);
    stepsServiceSpy.getStepsHistory.and.returnValue(of(mockHistoryResponse));

    await TestBed.configureTestingModule({
      imports: [StepsHistoryComponent],
      providers: [{ provide: StepsService, useValue: stepsServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(StepsHistoryComponent);
    component = fixture.componentInstance;
    component.deviceId = 'HK-SHOE-001';
  });

  it('should create and load steps history on changes', () => {
    component.ngOnChanges({
      deviceId: new SimpleChange(null, 'HK-SHOE-001', true),
    });
    fixture.detectChanges();

    expect(component.history().length).toBe(2);
    expect(component.totalAccumulated()).toBe(15000);
    expect(component.dailyAverage()).toBe(7500);
    expect(component.bestDay()?.total_steps).toBe(10000);
    expect(component.bestDay()?.date).toBe('2026-09-22');
  });

  it('should compute activity percentages correctly', () => {
    component.ngOnChanges({
      deviceId: new SimpleChange(null, 'HK-SHOE-001', true),
    });
    fixture.detectChanges();

    const percentages = component.activityPercentages();
    // Total steps: 15000. Walk: 9000 (60%), Run: 5000 (33%), Stairs: 1000 (7%)
    expect(percentages.walk).toBe(60);
    expect(percentages.run).toBe(33);
    expect(percentages.stairs).toBe(7);
    expect(percentages.unclassified).toBe(0);
  });

  it('should handle API errors gracefully', () => {
    stepsServiceSpy.getStepsHistory.and.returnValue(throwError(() => new Error('Server error')));

    component.loadHistory();
    fixture.detectChanges();

    expect(component.error()).toBeTrue();
    expect(component.history().length).toBe(0);
    expect(component.loading()).toBeFalse();
  });

  it('should switch time periods and reload data', () => {
    component.setPeriod(7);
    expect(component.selectedPeriodDays()).toBe(7);
    expect(stepsServiceSpy.getStepsHistory).toHaveBeenCalledWith('HK-SHOE-001', 7);
  });
});

