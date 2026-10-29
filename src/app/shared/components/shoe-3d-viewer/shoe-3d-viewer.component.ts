import {
  Component,
  ElementRef,
  ViewChild,
  NgZone,
  OnInit,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  input,
  output,
  signal,
  effect,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import {
  computeOrientationTrajectory,
  OrientationFrame,
  GaitPhase,
} from '../../../core/utils/madgwick.utils';
import { ImuReading } from '../../../models/telemetry.models';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ThemeService } from '../../../core/services/theme.service';
import { Shoe3dSceneService } from './shoe-3d-scene.service';

@Component({
  selector: 'app-shoe-3d-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  providers: [Shoe3dSceneService],
  templateUrl: './shoe-3d-viewer.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shoe3dViewerComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef<HTMLDivElement>;

  // Inputs
  readonly readings = input<ImuReading[]>([]);
  readonly externalTimeSec = input<number | null>(null);
  readonly autoPlay = input<boolean>(false);

  // Outputs
  readonly timeSelected = output<number>();

  // State Signals
  readonly isPlaying = signal<boolean>(false);
  readonly currentTimeSec = signal<number>(0);
  readonly totalDurationSec = signal<number>(0);
  readonly playbackSpeed = signal<number>(1.0);
  readonly isLooping = signal<boolean>(true);
  readonly livePitchDeg = signal<number>(0);
  readonly liveRollDeg = signal<number>(0);
  readonly liveYawDeg = signal<number>(0);
  readonly liveAx = signal<number>(0);
  readonly liveAy = signal<number>(0);
  readonly liveAz = signal<number>(1.0);
  readonly liveGaitPhase = signal<GaitPhase>('neutral');
  readonly liveAccelMag = signal<number>(1.0);
  readonly selectedModel = signal<'sneaker'>('sneaker');

  // Delegated Scene Signals
  readonly sceneService = inject(Shoe3dSceneService);
  readonly hasWebGlError = this.sceneService.hasWebGlError;
  readonly isModelLoading = this.sceneService.isModelLoading;
  readonly showAxes = this.sceneService.showAxes;
  readonly showAccelVectors = this.sceneService.showAccelVectors;
  readonly isZoomEnabled = this.sceneService.isZoomEnabled;

  // Playback speeds
  readonly speedOptions: number[] = [0.25, 0.5, 1.0, 2.0];

  // Trajectory cache
  private trajectory: OrientationFrame[] = [];
  private baseInverseQuat: THREE.Quaternion = new THREE.Quaternion();

  // Playback timing
  private lastRafTimestamp = 0;
  private animationFrameId: number | null = null;
  private readonly theme = inject(ThemeService);

  constructor(private readonly ngZone: NgZone) {
    effect(() => {
      const dark = this.theme.isDark();
      this.sceneService.updateTheme(dark);
    });
  }

  ngOnInit(): void {
    this.processReadings();
  }

  ngAfterViewInit(): void {
    this.sceneService.init(this.canvasContainer.nativeElement, this.theme.isDark());
    this.updateShoePose(0);
    if (this.autoPlay() && this.trajectory.length > 0) {
      this.play();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['readings']) {
      this.processReadings();
      this.resetPlayback();
      if (this.autoPlay() && this.trajectory.length > 0) {
        this.play();
      }
    }
    if (changes['externalTimeSec'] && this.externalTimeSec() !== null) {
      const extTime = this.externalTimeSec()!;
      if (Math.abs(this.currentTimeSec() - extTime) > 0.03 && !this.isPlaying()) {
        this.seekTo(extTime, false);
      }
    }
  }

  ngOnDestroy(): void {
    this.stopAnimation();
    this.sceneService.destroy();
  }

  toggleAxes(): void {
    this.sceneService.toggleAxes();
  }

  toggleAccelVectors(): void {
    this.sceneService.toggleAccelVectors();
  }

  resetCameraView(): void {
    this.sceneService.resetCameraView();
  }

  enableZoom(): void {
    this.sceneService.enableZoom();
  }

  disableZoom(): void {
    this.sceneService.disableZoom();
  }

  onWheel(event: WheelEvent): void {
    this.sceneService.handleWheelZoom(event);
  }

  // --- Biomechanical Trajectory Calculation ---

  private processReadings(): void {
    const list = this.readings();
    if (!list || list.length === 0) {
      this.trajectory = [];
      this.totalDurationSec.set(0);
      this.currentTimeSec.set(0);
      return;
    }

    this.trajectory = computeOrientationTrajectory(list, 0.25);
    const duration =
      this.trajectory.length > 0
        ? this.trajectory[this.trajectory.length - 1].timeSec
        : 0;
    this.totalDurationSec.set(duration);

    if (this.trajectory.length > 0) {
      // Sensor ISB Frame -> Three.js Space: X_3 <- q_y, Y_3 <- q_z, Z_3 <- q_x
      const q0 = this.trajectory[0].q;
      const initialQuat = new THREE.Quaternion(q0.y, q0.z, q0.x, q0.w).normalize();
      this.baseInverseQuat = initialQuat.clone().invert();
    }
    this.updateShoePose(0);
  }

  // --- Replay Controls & Animation Loop ---

  togglePlayback(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(): void {
    if (this.trajectory.length === 0) return;
    if (this.currentTimeSec() >= this.totalDurationSec()) {
      this.currentTimeSec.set(0);
    }
    this.isPlaying.set(true);
    this.lastRafTimestamp = performance.now();

    this.ngZone.runOutsideAngular(() => {
      this.startAnimationLoop();
    });
  }

  pause(): void {
    this.isPlaying.set(false);
    this.stopAnimation();
  }

  resetPlayback(): void {
    this.pause();
    this.currentTimeSec.set(0);
    this.updateShoePose(0);
    this.sceneService.render();
  }

  seekTo(targetTimeSec: number, emitExternal = true): void {
    const clamped = Math.max(0, Math.min(this.totalDurationSec(), targetTimeSec));
    this.currentTimeSec.set(clamped);
    this.updateShoePose(clamped);
    this.sceneService.render();

    if (emitExternal) {
      this.timeSelected.emit(clamped);
    }
  }

  onSliderInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.seekTo(val, true);
  }

  setSpeed(speed: number): void {
    this.playbackSpeed.set(speed);
  }

  toggleLoop(): void {
    this.isLooping.update((v) => !v);
  }

  step(direction: number): void {
    const stepDt = 0.05 * direction;
    this.seekTo(this.currentTimeSec() + stepDt, true);
  }

  private startAnimationLoop(): void {
    const loop = (timestamp: number) => {
      if (!this.isPlaying()) return;

      const deltaSec = ((timestamp - this.lastRafTimestamp) / 1000) * this.playbackSpeed();
      this.lastRafTimestamp = timestamp;

      let nextTime = this.currentTimeSec() + deltaSec;
      const total = this.totalDurationSec();

      if (nextTime >= total) {
        if (this.isLooping() && total > 0) {
          nextTime = 0;
        } else {
          nextTime = total;
          this.ngZone.run(() => {
            this.pause();
            this.currentTimeSec.set(total);
            this.timeSelected.emit(total);
          });
          this.updateShoePose(total);
          this.sceneService.render();
          return;
        }
      }

      this.currentTimeSec.set(nextTime);
      this.updateShoePose(nextTime);
      this.sceneService.render();

      this.timeSelected.emit(nextTime);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // --- Dynamic Pose Interpolation ---

  private updateShoePose(timeSec: number): void {
    if (this.trajectory.length === 0) return;

    let idx = this.trajectory.findIndex((f) => f.timeSec >= timeSec);
    if (idx === -1) idx = this.trajectory.length - 1;

    const frame = this.trajectory[idx];
    if (!frame) return;

    this.sceneService.updatePose(frame, this.baseInverseQuat);

    const ax = frame.accel?.ax ?? 0;
    const ay = frame.accel?.ay ?? 0;
    const az = frame.accel?.az ?? 1.0;
    const mag = frame.accelMag || Math.sqrt(ax * ax + ay * ay + az * az);

    // Update Live HUD Metrics
    this.livePitchDeg.set(Math.round(frame.euler.pitch * 10) / 10);
    this.liveRollDeg.set(Math.round(frame.euler.roll * 10) / 10);
    this.liveYawDeg.set(Math.round(frame.euler.yaw * 10) / 10);
    this.liveAx.set(Math.round(ax * 100) / 100);
    this.liveAy.set(Math.round(ay * 100) / 100);
    this.liveAz.set(Math.round(az * 100) / 100);
    this.liveGaitPhase.set(frame.gaitPhase);
    this.liveAccelMag.set(Math.round(mag * 100) / 100);
  }
}
