import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Shoe3dViewerComponent } from './shoe-3d-viewer.component';
import { ImuReading } from '../../../models/telemetry.models';

describe('Shoe3dViewerComponent', () => {
  let component: Shoe3dViewerComponent;
  let fixture: ComponentFixture<Shoe3dViewerComponent>;

  const mockReadings: ImuReading[] = [
    {
      timestamp_epoch_us: 1000000,
      timestamp_iso: '2026-10-07T00:00:01.000Z',
      ax: 0.05,
      ay: 0.1,
      az: 0.98,
      gx: 0.01,
      gy: 0.02,
      gz: 0.0,
    },
    {
      timestamp_epoch_us: 1050000,
      timestamp_iso: '2026-10-07T00:00:01.050Z',
      ax: 0.2,
      ay: 0.15,
      az: 1.1,
      gx: 0.1,
      gy: 0.05,
      gz: 0.02,
    },
    {
      timestamp_epoch_us: 1100000,
      timestamp_iso: '2026-10-07T00:00:01.100Z',
      ax: -0.1,
      ay: 0.05,
      az: 0.95,
      gx: -0.05,
      gy: 0.01,
      gz: 0.0,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shoe3dViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Shoe3dViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate duration and trajectory from input readings', () => {
    fixture.componentRef.setInput('readings', mockReadings);
    fixture.detectChanges();

    expect(component.totalDurationSec()).toBeCloseTo(0.1, 2);
  });

  it('should toggle playback state', () => {
    fixture.componentRef.setInput('readings', mockReadings);
    fixture.detectChanges();

    expect(component.isPlaying()).toBeFalse();
    component.togglePlayback();
    expect(component.isPlaying()).toBeTrue();
    component.togglePlayback();
    expect(component.isPlaying()).toBeFalse();
  });

  it('should seek to specific timestamp and emit timeSelected', () => {
    fixture.componentRef.setInput('readings', mockReadings);
    fixture.detectChanges();

    let emittedTime = -1;
    component.timeSelected.subscribe((t) => (emittedTime = t));

    component.seekTo(0.05, true);
    expect(component.currentTimeSec()).toBeCloseTo(0.05, 2);
    expect(emittedTime).toBeCloseTo(0.05, 2);
  });

  it('should change playback speed', () => {
    expect(component.playbackSpeed()).toBe(1.0);
    component.setSpeed(0.5);
    expect(component.playbackSpeed()).toBe(0.5);
    component.setSpeed(2.0);
    expect(component.playbackSpeed()).toBe(2.0);
  });

  it('should step forward and backward in time', () => {
    fixture.componentRef.setInput('readings', mockReadings);
    fixture.detectChanges();

    component.seekTo(0.05, false);
    component.step(1); // +0.05s
    expect(component.currentTimeSec()).toBeCloseTo(0.1, 2);

    component.step(-1); // -0.05s
    expect(component.currentTimeSec()).toBeCloseTo(0.05, 2);
  });

  it('should toggle loop setting', () => {
    expect(component.isLooping()).toBeTrue();
    component.toggleLoop();
    expect(component.isLooping()).toBeFalse();
    component.toggleLoop();
    expect(component.isLooping()).toBeTrue();
  });

  it('should toggle ISB axes visibility', () => {
    expect(component.showAxes()).toBeTrue();
    component.toggleAxes();
    expect(component.showAxes()).toBeFalse();
    component.toggleAxes();
    expect(component.showAxes()).toBeTrue();
  });

  it('should switch between sneaker and insole 3D models', () => {
    expect(component.selectedModel()).toBe('sneaker');
    component.setModel('insole');
    expect(component.selectedModel()).toBe('insole');
    component.setModel('sneaker');
    expect(component.selectedModel()).toBe('sneaker');
  });

  it('should toggle acceleration vectors visibility', () => {
    expect(component.showAccelVectors()).toBeTrue();
    component.toggleAccelVectors();
    expect(component.showAccelVectors()).toBeFalse();
    component.toggleAccelVectors();
    expect(component.showAccelVectors()).toBeTrue();
  });

  it('should render acceleration components and legend in HUD', () => {
    fixture.componentRef.setInput('readings', mockReadings);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const accelHud = compiled.querySelector('[data-testid="hud-accel-components"]');
    expect(accelHud).toBeTruthy();

    const accelLegend = compiled.querySelector('[data-testid="hud-accel-legend"]');
    expect(accelLegend).toBeTruthy();

    component.toggleAccelVectors();
    fixture.detectChanges();
    expect(compiled.querySelector('[data-testid="hud-accel-legend"]')).toBeNull();
  });
});
