import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { ImuChartComponent } from './imu-chart.component';
import { mockImuReadings } from '../../../../testing/mocks/telemetry.mock';

describe('ImuChartComponent', () => {
  let component: ImuChartComponent;
  let fixture: ComponentFixture<ImuChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImuChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImuChartComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render empty state message when no readings are provided', () => {
    component.readings = [];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aucun point de télémétrie IMU disponible');
  });

  it('should render acceleration and gyroscope canvas containers when readings are provided', () => {
    component.readings = mockImuReadings;
    fixture.detectChanges();

    // Trigger ngOnChanges
    component.ngOnChanges({
      readings: new SimpleChange(null, mockImuReadings, true),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Accélération Tri-axiale');
    expect(compiled.textContent).toContain('Vitesse Angulaire (Gyroscope)');
    expect(compiled.querySelectorAll('canvas').length).toBe(2);
  });

  it('should properly clean up Chart instances on ngOnDestroy', () => {
    component.readings = mockImuReadings;
    fixture.detectChanges();

    component.ngOnChanges({
      readings: new SimpleChange(null, mockImuReadings, true),
    });

    // Destroy should execute without throwing errors
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});

