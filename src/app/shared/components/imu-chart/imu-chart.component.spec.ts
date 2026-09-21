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

  it('should toggle individual acceleration axes and update signals', () => {
    component.readings = mockImuReadings;
    fixture.detectChanges();
    component.ngOnChanges({
      readings: new SimpleChange(null, mockImuReadings, true),
    });
    fixture.detectChanges();

    expect(component.showAx()).toBeTrue();
    expect(component.showAy()).toBeTrue();
    expect(component.showAz()).toBeTrue();
    expect(component.showMag()).toBeFalse();

    // Toggle AX
    component.toggleAccelAxis('ax');
    expect(component.showAx()).toBeFalse();

    // Toggle AY
    component.toggleAccelAxis('ay');
    expect(component.showAy()).toBeFalse();

    // Toggle AZ
    component.toggleAccelAxis('az');
    expect(component.showAz()).toBeFalse();

    // Toggle Mag (was false, should become true)
    component.toggleAccelAxis('mag');
    expect(component.showMag()).toBeTrue();

    // Re-enable AX
    component.toggleAccelAxis('ax');
    expect(component.showAx()).toBeTrue();
  });

  it('should enable and disable all acceleration axes with quick actions', () => {
    component.readings = mockImuReadings;
    fixture.detectChanges();
    component.ngOnChanges({
      readings: new SimpleChange(null, mockImuReadings, true),
    });
    fixture.detectChanges();

    // Set all to false
    component.setAllAccel(false);
    expect(component.showAx()).toBeFalse();
    expect(component.showAy()).toBeFalse();
    expect(component.showAz()).toBeFalse();
    expect(component.showMag()).toBeFalse();

    // Set all to true
    component.setAllAccel(true);
    expect(component.showAx()).toBeTrue();
    expect(component.showAy()).toBeTrue();
    expect(component.showAz()).toBeTrue();
    expect(component.showMag()).toBeTrue();
  });

  it('should toggle individual gyroscope axes and handle quick actions', () => {
    component.readings = mockImuReadings;
    fixture.detectChanges();
    component.ngOnChanges({
      readings: new SimpleChange(null, mockImuReadings, true),
    });
    fixture.detectChanges();

    expect(component.showGx()).toBeTrue();
    expect(component.showGy()).toBeTrue();
    expect(component.showGz()).toBeTrue();

    // Toggle GX, GY, GZ
    component.toggleGyroAxis('gx');
    expect(component.showGx()).toBeFalse();

    component.toggleGyroAxis('gy');
    expect(component.showGy()).toBeFalse();

    component.toggleGyroAxis('gz');
    expect(component.showGz()).toBeFalse();

    // Quick action: all
    component.setAllGyro(true);
    expect(component.showGx()).toBeTrue();
    expect(component.showGy()).toBeTrue();
    expect(component.showGz()).toBeTrue();

    // Quick action: none
    component.setAllGyro(false);
    expect(component.showGx()).toBeFalse();
    expect(component.showGy()).toBeFalse();
    expect(component.showGz()).toBeFalse();
  });

  it('should render axis toggle buttons in DOM and handle user click events', () => {
    component.readings = mockImuReadings;
    fixture.detectChanges();
    component.ngOnChanges({
      readings: new SimpleChange(null, mockImuReadings, true),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const axBtn = compiled.querySelector('[data-testid="toggle-axis-ax"]') as HTMLButtonElement;
    const gxBtn = compiled.querySelector('[data-testid="toggle-axis-gx"]') as HTMLButtonElement;
    const accelNoneBtn = compiled.querySelector('[data-testid="accel-select-none"]') as HTMLButtonElement;

    expect(axBtn).toBeTruthy();
    expect(gxBtn).toBeTruthy();
    expect(accelNoneBtn).toBeTruthy();

    expect(axBtn.getAttribute('aria-pressed')).toBe('true');

    // Click AX button to toggle
    axBtn.click();
    fixture.detectChanges();

    expect(component.showAx()).toBeFalse();
    expect(axBtn.getAttribute('aria-pressed')).toBe('false');

    // Click quick action "Aucun"
    accelNoneBtn.click();
    fixture.detectChanges();

    expect(component.showAx()).toBeFalse();
    expect(component.showAy()).toBeFalse();
    expect(component.showAz()).toBeFalse();
    expect(component.showMag()).toBeFalse();
  });

  it('should toggle ISB biomechanical standard guide panel', () => {
    component.readings = mockImuReadings;
    fixture.detectChanges();
    component.ngOnChanges({
      readings: new SimpleChange(null, mockImuReadings, true),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const toggleBtn = compiled.querySelector('[data-testid="toggle-isb-guide-btn"]') as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();

    // Initially closed
    expect(component.showIsbGuide()).toBeFalse();
    expect(compiled.querySelector('[data-testid="isb-guide-panel"]')).toBeNull();

    // Toggle open
    toggleBtn.click();
    fixture.detectChanges();

    expect(component.showIsbGuide()).toBeTrue();
    const panel = compiled.querySelector('[data-testid="isb-guide-panel"]');
    expect(panel).toBeTruthy();
    expect(panel?.textContent).toContain('Cavanagh');
    expect(panel?.textContent).toContain('Antéro-postérieur');
    expect(panel?.textContent).toContain('Médio-latéral');
    expect(panel?.textContent).toContain('Longitudinal / Vertical');

    // Toggle close
    toggleBtn.click();
    fixture.detectChanges();
    expect(component.showIsbGuide()).toBeFalse();
    expect(compiled.querySelector('[data-testid="isb-guide-panel"]')).toBeNull();
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

