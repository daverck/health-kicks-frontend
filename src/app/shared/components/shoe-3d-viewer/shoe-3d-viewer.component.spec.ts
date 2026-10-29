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

  it('should use the sneaker 3D model by default and not render model switcher buttons', () => {
    expect(component.selectedModel()).toBe('sneaker');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="model-insole-btn"]')).toBeNull();
    expect(compiled.querySelector('[data-testid="model-sneaker-btn"]')).toBeNull();
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

  it('should render replay controller bar and play button outside the canvas viewport', () => {
    fixture.componentRef.setInput('readings', mockReadings);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const playBtn = compiled.querySelector('[data-testid="replay-play-btn"]') as HTMLButtonElement;
    expect(playBtn).toBeTruthy();
    expect(playBtn.textContent).toContain('Lecture');

    const canvasViewport = compiled.querySelector('[data-testid="canvas-viewport"]');
    expect(canvasViewport).toBeTruthy();
    expect(canvasViewport?.contains(playBtn)).toBeFalse();
  });

  it('should require clicking the 3D viewport before allowing wheel zoom and disable zoom on mouseleave', () => {
    fixture.componentRef.setInput('readings', mockReadings);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const viewport = compiled.querySelector('[data-testid="canvas-viewport"]') as HTMLElement;
    const hintBadge = compiled.querySelector('[data-testid="zoom-hint-badge"]') as HTMLElement;

    expect(viewport).toBeTruthy();
    expect(hintBadge).toBeTruthy();

    // Initially zoom is disabled
    expect(component.isZoomEnabled()).toBeFalse();
    expect(hintBadge.textContent).toContain('Cliquer pour activer le zoom');
    expect(viewport.classList.contains('border-primary-500')).toBeFalse();

    const initialRadius = component.sceneService.getCameraRadius();

    // Wheel event while disabled should NOT preventDefault and should NOT change radius
    const wheelBeforeClick = new WheelEvent('wheel', { deltaY: -100, cancelable: true });
    viewport.dispatchEvent(wheelBeforeClick);
    expect(wheelBeforeClick.defaultPrevented).toBeFalse();
    expect(component.sceneService.getCameraRadius()).toBe(initialRadius);

    // Click on viewport activates zoom
    viewport.click();
    fixture.detectChanges();

    expect(component.isZoomEnabled()).toBeTrue();
    expect(hintBadge.textContent).toContain('Molette pour zoomer');
    expect(viewport.classList.contains('border-primary-500')).toBeTrue();
    expect(viewport.classList.contains('ring-2')).toBeTrue();

    // Wheel event while enabled SHOULD preventDefault and update camera radius
    const wheelAfterClick = new WheelEvent('wheel', { deltaY: -100, cancelable: true });
    viewport.dispatchEvent(wheelAfterClick);
    expect(wheelAfterClick.defaultPrevented).toBeTrue();
    expect(component.sceneService.getCameraRadius()).toBeLessThan(initialRadius);

    // Mouseleave disables zoom again
    viewport.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();

    expect(component.isZoomEnabled()).toBeFalse();
    expect(hintBadge.textContent).toContain('Cliquer pour activer le zoom');
    expect(viewport.classList.contains('border-primary-500')).toBeFalse();
  });

  it('should use zoomed-out initial camera radius (4.8), lower base plane (-0.35), and track shoe 3D displacement with camera', () => {
    const dynamicReadings: ImuReading[] = [
      {
        timestamp_epoch_us: 1000000,
        timestamp_iso: '2026-10-07T00:00:01.000Z',
        ax: 0.0,
        ay: 0.0,
        az: 1.0,
        gx: 0.0,
        gy: 0.0,
        gz: 0.0,
      },
      {
        timestamp_epoch_us: 1050000,
        timestamp_iso: '2026-10-07T00:00:01.050Z',
        ax: 0.85,
        ay: 0.35,
        az: 1.4,
        gx: 25.0,
        gy: 10.0,
        gz: 0.0,
      },
      {
        timestamp_epoch_us: 1100000,
        timestamp_iso: '2026-10-07T00:00:01.100Z',
        ax: 0.9,
        ay: 0.4,
        az: 1.3,
        gx: 20.0,
        gy: 8.0,
        gz: 0.0,
      },
    ];

    fixture.componentRef.setInput('readings', dynamicReadings);
    fixture.detectChanges();

    // Initial zoomed-out radius and lowered base plane
    expect(component.sceneService.getCameraRadius()).toBeCloseTo(4.8, 2);
    const initialShoePos = component.sceneService.getShoePosition();
    expect(initialShoePos.x).toBeCloseTo(0, 3);
    expect(initialShoePos.y).toBeCloseTo(-0.35, 3);
    expect(initialShoePos.z).toBeCloseTo(0, 3);

    // Seek to end of dynamic movement: shoe and camera target must both move
    component.seekTo(0.1, false);
    const movedShoePos = component.sceneService.getShoePosition();
    const movedCamTarget = component.sceneService.getCameraTarget();

    expect(movedShoePos.z).toBeGreaterThan(0);
    expect(movedShoePos.x).toBeGreaterThan(0);
    expect(movedShoePos.y).toBeGreaterThan(-0.35);

    expect(movedCamTarget.x).toBeCloseTo(movedShoePos.x, 4);
    expect(movedCamTarget.z).toBeCloseTo(movedShoePos.z, 4);
  });
});
