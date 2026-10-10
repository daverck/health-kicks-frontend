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
  computed,
  effect,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  computeOrientationTrajectory,
  OrientationFrame,
  GaitPhase,
} from '../../../core/utils/madgwick.utils';
import { ImuReading } from '../../../models/telemetry.models';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-shoe-3d-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
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
  readonly hasWebGlError = signal<boolean>(false);
  readonly showAxes = signal<boolean>(true);
  readonly showAccelVectors = signal<boolean>(true);
  readonly selectedModel = signal<'sneaker'>('sneaker');

  // Playback speeds
  readonly speedOptions: number[] = [0.25, 0.5, 1.0, 2.0];

  // Three.js instances
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private shoeGroup: THREE.Group | null = null;
  private axesGroup: THREE.Group | null = null;
  private accelVectorsGroup: THREE.Group | null = null;
  private accelResultantArrow: THREE.ArrowHelper | null = null;
  private accelAxArrow: THREE.ArrowHelper | null = null;
  private accelAyArrow: THREE.ArrowHelper | null = null;
  private accelAzArrow: THREE.ArrowHelper | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Trajectory cache
  private trajectory: OrientationFrame[] = [];
  private baseInverseQuat: THREE.Quaternion = new THREE.Quaternion();

  // Playback timing
  private lastRafTimestamp = 0;

  // Orbit navigation state
  private isPointerDown = false;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private cameraSpherical = { radius: 3.8, theta: Math.PI / 4, phi: Math.PI / 3 };
  private readonly theme = inject(ThemeService);

  constructor(private readonly ngZone: NgZone) {
    effect(() => {
      const dark = this.theme.isDark();
      this.updateThemeColors(dark);
    });
  }

  ngOnInit(): void {
    this.processReadings();
  }

  ngAfterViewInit(): void {
    this.initThreeJs();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['readings']) {
      this.processReadings();
      this.resetPlayback();
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
    this.cleanupThreeJs();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
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
      // Establish zero-reference orientation from initial static frames
      // Sensor ISB Frame -> Three.js Space: X_3 <- q_y, Y_3 <- q_z, Z_3 <- q_x
      const q0 = this.trajectory[0].q;
      const initialQuat = new THREE.Quaternion(q0.y, q0.z, q0.x, q0.w).normalize();
      this.baseInverseQuat = initialQuat.clone().invert();
    }
    this.updateShoePose(0);
  }

  // --- Three.js 3D Setup ---

  private initThreeJs(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    try {
      const isDark = this.theme.isDark();
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(isDark ? 0x0f172a : 0xf8fafc);

      // Camera
      this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
      this.updateCameraPosition();

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;

      container.appendChild(this.renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.5);
      hemiLight.position.set(0, 10, 0);
      this.scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
      dirLight.position.set(4, 8, 4);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 20;
      dirLight.shadow.bias = -0.001;
      this.scene.add(dirLight);

      // Floor Grid and Shadow Receiver
      this.gridHelper = new THREE.GridHelper(5, 10, isDark ? 0x38bdf8 : 0x0284c7, isDark ? 0x334155 : 0xe2e8f0);
      this.gridHelper.position.y = -0.01;
      this.scene.add(this.gridHelper);

      const floorGeo = new THREE.PlaneGeometry(8, 8);
      const floorMat = new THREE.ShadowMaterial({ opacity: isDark ? 0.35 : 0.15 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.02;
      floor.receiveShadow = true;
      this.scene.add(floor);

      // Build Procedural 3D Athletic Shoe Model & ISB Axes Helper
      this.shoeGroup = new THREE.Group();
      this.rebuildModel();
      this.scene.add(this.shoeGroup);

      // Setup Mouse/Touch Orbit Controls
      this.setupOrbitHandlers(container);

      // Initial Render
      this.renderer.render(this.scene, this.camera);
    } catch (err) {
      console.error('WebGL initialization error:', err);
      this.hasWebGlError.set(true);
    }
  }

  toggleAxes(): void {
    this.showAxes.update((v) => !v);
    if (this.axesGroup) {
      this.axesGroup.visible = this.showAxes();
    }
    this.renderScene();
  }

  toggleAccelVectors(): void {
    this.showAccelVectors.update((v) => !v);
    if (this.accelVectorsGroup) {
      this.accelVectorsGroup.visible = this.showAccelVectors();
    }
    this.renderScene();
  }

  private cachedSneakerMesh: THREE.Group | null = null;
  readonly isModelLoading = signal(false);

  private rebuildModel(): void {
    if (!this.shoeGroup) return;

    // Clear existing children
    while (this.shoeGroup.children.length > 0) {
      const child = this.shoeGroup.children[0];
      this.shoeGroup.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    }

    this.loadSneakerModel();
  }

  private loadSneakerModel(): void {
    if (!this.shoeGroup) return;

    if (this.cachedSneakerMesh) {
      const clone = this.cachedSneakerMesh.clone(true);
      this.shoeGroup.add(clone);
      this.attachAxesHelper();
      this.renderScene();
      return;
    }

    this.attachAxesHelper();
    this.renderScene();

    try {
      const loader = new GLTFLoader();
      this.isModelLoading.set(true);
      loader.load(
        '/models/blue_sneaker.glb',
        (gltf) => {
          this.isModelLoading.set(false);
          if (!this.shoeGroup) return;

          const model = gltf.scene;

          // Compute raw bounding box and dimensions
          const bbox = new THREE.Box3().setFromObject(model);
          const size = bbox.getSize(new THREE.Vector3());
          const center = bbox.getCenter(new THREE.Vector3());

          // Target length along Z = 2.0 (matching ISB foot coordinate system)
          const targetLength = 2.0;
          const scale = size.z > 0 ? targetLength / size.z : 0.068;
          model.scale.set(scale, scale, scale);

          // Center on X, sole flat at ground Y=0, pivot near subtalar joint
          model.position.x = -center.x * scale;
          model.position.y = -bbox.min.y * scale;
          model.position.z = -center.z * scale + 0.15;

          // Enable shadows
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          const container = new THREE.Group();
          container.add(model);
          this.cachedSneakerMesh = container;

          this.shoeGroup.add(container.clone(true));
          this.attachAxesHelper();
          this.renderScene();
        },
        undefined,
        (err) => {
          console.warn('Could not load /models/blue_sneaker.glb:', err);
          this.isModelLoading.set(false);
        }
      );
    } catch (e) {
      console.warn('GLTFLoader error:', e);
      this.isModelLoading.set(false);
    }
  }

  private attachAxesHelper(): void {
    if (!this.shoeGroup) return;
    if (this.axesGroup) {
      this.shoeGroup.remove(this.axesGroup);
    }
    this.axesGroup = this.buildAxesHelper();
    this.axesGroup.visible = this.showAxes();
    this.shoeGroup.add(this.axesGroup);

    if (this.accelVectorsGroup) {
      this.shoeGroup.remove(this.accelVectorsGroup);
    }
    this.accelVectorsGroup = this.buildAccelVectors();
    this.accelVectorsGroup.visible = this.showAccelVectors();
    this.shoeGroup.add(this.accelVectorsGroup);
  }

  private updateThemeColors(isDark: boolean): void {
    if (!this.scene) return;
    this.scene.background = new THREE.Color(isDark ? 0x0f172a : 0xf8fafc);
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper.geometry.dispose();
      (this.gridHelper.material as THREE.Material).dispose();
      this.gridHelper = new THREE.GridHelper(5, 10, isDark ? 0x38bdf8 : 0x0284c7, isDark ? 0x334155 : 0xe2e8f0);
      this.gridHelper.position.y = -0.01;
      this.scene.add(this.gridHelper);
    }
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }





  /**
   * Constructs the 3D ISB coordinate axes helper matching ISB Biomechanical Standard colors:
   * - X (Antéro-postérieur / Avant): Rouge (0xef4444) along Three.js +Z
   * - Y (Médio-latéral / Droite): Vert émeraude (0x10b981) along Three.js +X
   * - Z (Longitudinal / Vertical / Haut): Bleu (0x3b82f6) along Three.js +Y
   */
  private buildAxesHelper(): THREE.Group {
    const axes = new THREE.Group();
    axes.name = 'isb-axes';
    axes.position.set(0, 0.45, 0);

    const axisLength = 0.8;
    const shaftRadius = 0.018;
    const coneHeight = 0.16;
    const coneRadius = 0.055;

    // Center pivot sphere
    const centerSphereGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const centerSphere = new THREE.Mesh(centerSphereGeo, centerMat);
    axes.add(centerSphere);

    // --- 1. X Axis (Antéro-postérieur / Avant) -> along +Z (Red 0xef4444) ---
    const xMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    const xShaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, axisLength, 12);
    xShaftGeo.rotateX(Math.PI / 2);
    const xShaft = new THREE.Mesh(xShaftGeo, xMat);
    xShaft.position.set(0, 0, axisLength / 2);
    axes.add(xShaft);

    const xConeGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
    xConeGeo.rotateX(Math.PI / 2);
    const xCone = new THREE.Mesh(xConeGeo, xMat);
    xCone.position.set(0, 0, axisLength + coneHeight / 2);
    axes.add(xCone);

    const xTipGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const xTip = new THREE.Mesh(xTipGeo, xMat);
    xTip.position.set(0, 0, axisLength + coneHeight);
    axes.add(xTip);

    // --- 2. Y Axis (Médio-latéral / Droite) -> along +X (Emerald 0x10b981) ---
    const yMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    const yShaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, axisLength, 12);
    yShaftGeo.rotateZ(-Math.PI / 2);
    const yShaft = new THREE.Mesh(yShaftGeo, yMat);
    yShaft.position.set(axisLength / 2, 0, 0);
    axes.add(yShaft);

    const yConeGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
    yConeGeo.rotateZ(-Math.PI / 2);
    const yCone = new THREE.Mesh(yConeGeo, yMat);
    yCone.position.set(axisLength + coneHeight / 2, 0, 0);
    axes.add(yCone);

    const yTipGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const yTip = new THREE.Mesh(yTipGeo, yMat);
    yTip.position.set(axisLength + coneHeight, 0, 0);
    axes.add(yTip);

    // --- 3. Z Axis (Longitudinal / Vertical / Haut) -> along +Y (Blue 0x3b82f6) ---
    const zMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    const zShaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, axisLength, 12);
    const zShaft = new THREE.Mesh(zShaftGeo, zMat);
    zShaft.position.set(0, axisLength / 2, 0);
    axes.add(zShaft);

    const zConeGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
    const zCone = new THREE.Mesh(zConeGeo, zMat);
    zCone.position.set(0, axisLength + coneHeight / 2, 0);
    axes.add(zCone);

    const zTipGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const zTip = new THREE.Mesh(zTipGeo, zMat);
    zTip.position.set(0, axisLength + coneHeight, 0);
    axes.add(zTip);

    return axes;
  }

  /**
   * Constructs dynamic 3D acceleration vectors attached to the shoe/sensor coordinate frame:
   * - Resultant vector (Violet/Purple 0xa855f7): dynamic 3D direction and magnitude |a|
   * - Ax component arrow (Red 0xef4444): along Three.js Z (sensor X antero-posterior)
   * - Ay component arrow (Emerald 0x10b981): along Three.js X (sensor Y medio-lateral)
   * - Az component arrow (Blue 0x3b82f6): along Three.js Y (sensor Z vertical)
   */
  private buildAccelVectors(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'accel-vectors';
    group.position.set(0, 0.45, 0);

    // 1. Resultant acceleration vector (Purple 0xa855f7)
    this.accelResultantArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      0.6,
      0xa855f7,
      0.16,
      0.08
    );
    group.add(this.accelResultantArrow);

    // 2. Ax component arrow (Along Three.js Z)
    this.accelAxArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      0.2,
      0xef4444,
      0.1,
      0.05
    );
    group.add(this.accelAxArrow);

    // 3. Ay component arrow (Along Three.js X)
    this.accelAyArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      0.2,
      0x10b981,
      0.1,
      0.05
    );
    group.add(this.accelAyArrow);

    // 4. Az component arrow (Along Three.js Y)
    this.accelAzArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      0.5,
      0x3b82f6,
      0.1,
      0.05
    );
    group.add(this.accelAzArrow);

    group.visible = this.showAccelVectors();
    return group;
  }

  // --- Orbit & Interaction Handlers ---

  private setupOrbitHandlers(container: HTMLElement): void {
    container.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isPointerDown = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      container.setPointerCapture(e.pointerId);
    });

    container.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isPointerDown) return;
      const deltaX = e.clientX - this.prevPointerX;
      const deltaY = e.clientY - this.prevPointerY;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;

      this.cameraSpherical.theta -= deltaX * 0.008;
      this.cameraSpherical.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, this.cameraSpherical.phi - deltaY * 0.008)
      );
      this.updateCameraPosition();
      this.renderScene();
    });

    const stopDrag = (e: PointerEvent) => {
      if (this.isPointerDown) {
        this.isPointerDown = false;
        try {
          container.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };

    container.addEventListener('pointerup', stopDrag);
    container.addEventListener('pointercancel', stopDrag);

    // Wheel zoom
    container.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        this.cameraSpherical.radius = Math.max(
          2.0,
          Math.min(7.0, this.cameraSpherical.radius + e.deltaY * 0.003)
        );
        this.updateCameraPosition();
        this.renderScene();
      },
      { passive: false }
    );
  }

  private updateCameraPosition(): void {
    if (!this.camera) return;
    const { radius, theta, phi } = this.cameraSpherical;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0.35, 0);
  }

  resetCameraView(): void {
    this.cameraSpherical = { radius: 3.8, theta: Math.PI / 4, phi: Math.PI / 3 };
    this.updateCameraPosition();
    this.renderScene();
  }

  private setupResizeObserver(): void {
    if (!window.ResizeObserver) return;
    this.resizeObserver = new ResizeObserver(() => {
      const container = this.canvasContainer?.nativeElement;
      if (!container || !this.renderer || !this.camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.renderScene();
      }
    });
    this.resizeObserver.observe(this.canvasContainer.nativeElement);
  }

  private renderScene(): void {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private cleanupThreeJs(): void {
    if (this.renderer) {
      this.renderer.dispose();
      const dom = this.renderer.domElement;
      if (dom && dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.shoeGroup = null;
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
    this.renderScene();
  }

  seekTo(targetTimeSec: number, emitExternal = true): void {
    const clamped = Math.max(0, Math.min(this.totalDurationSec(), targetTimeSec));
    this.currentTimeSec.set(clamped);
    this.updateShoePose(clamped);
    this.renderScene();

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
          this.renderScene();
          return;
        }
      }

      this.currentTimeSec.set(nextTime);
      this.updateShoePose(nextTime);
      this.renderScene();

      // Emit time for cursor synchronization
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
    if (!this.shoeGroup || this.trajectory.length === 0) return;

    // Find surrounding trajectory frames for smooth interpolation
    let idx = this.trajectory.findIndex((f) => f.timeSec >= timeSec);
    if (idx === -1) idx = this.trajectory.length - 1;

    const frame = this.trajectory[idx];
    if (!frame) return;

    // Convert raw frame quaternion to Three.js orientation space
    // Sensor ISB Frame -> Three.js Cyclic Permutation:
    // Three.js X (Right)   <- Sensor Y (Medio-lateral)
    // Three.js Y (Up)      <- Sensor Z (Vertical / Longitudinal)
    // Three.js Z (Forward) <- Sensor X (Antéro-postérieur)
    const qRaw = new THREE.Quaternion(
      frame.q.y,
      frame.q.z,
      frame.q.x,
      frame.q.w
    ).normalize();

    // Multiply by inverse base quaternion so resting orientation is zeroed
    const targetQ = this.baseInverseQuat.clone().multiply(qRaw);

    this.shoeGroup.quaternion.copy(targetQ);

    const ax = frame.accel?.ax ?? 0;
    const ay = frame.accel?.ay ?? 0;
    const az = frame.accel?.az ?? 1.0;
    const mag = frame.accelMag || Math.sqrt(ax * ax + ay * ay + az * az);

    // Elevation bobbing according to gait phase & vertical acceleration compliance
    let verticalOffset = 0;
    if (frame.gaitPhase === 'heel_strike') {
      verticalOffset = 0.08;
    } else if (frame.gaitPhase === 'toe_off') {
      verticalOffset = 0.12;
    } else if (frame.gaitPhase === 'swing') {
      verticalOffset = 0.16;
    }

    // Dynamic bounded displacement based on tri-axial accelerations:
    // Vertical (Y): baseline gait offset + dynamic vertical compliance (az)
    const vertDynamic = Math.max(-0.06, Math.min((az - 1.0) * 0.06, 0.14));
    // Forward / backward (Z): reactions to antero-posterior acceleration (ax)
    const forwardDynamic = Math.max(-0.12, Math.min(ax * 0.05, 0.12));
    // Lateral (X): reactions to medio-lateral acceleration (ay)
    const lateralDynamic = Math.max(-0.08, Math.min(ay * 0.04, 0.08));

    this.shoeGroup.position.set(lateralDynamic, verticalOffset + vertDynamic, forwardDynamic);

    // Update dynamic acceleration vectors:
    if (this.accelVectorsGroup && this.showAccelVectors()) {
      const scale = 0.55;

      // Resultant 3D acceleration vector:
      // Three.js (X, Y, Z) = Sensor (Ay, Az, Ax)
      const resDir = new THREE.Vector3(ay, az, ax);
      const resMag = resDir.length();
      if (resMag > 0.001) {
        resDir.normalize();
      } else {
        resDir.set(0, 1, 0);
      }
      const resLen = Math.max(0.08, Math.min(resMag * scale, 2.5));
      this.accelResultantArrow?.setDirection(resDir);
      this.accelResultantArrow?.setLength(
        resLen,
        Math.min(0.14, resLen * 0.35),
        Math.min(0.07, resLen * 0.2)
      );

      // Ax arrow (along Three.js Z)
      const axDir = new THREE.Vector3(0, 0, ax >= 0 ? 1 : -1);
      const axLen = Math.max(0.02, Math.min(Math.abs(ax) * scale, 1.8));
      this.accelAxArrow?.setDirection(axDir);
      this.accelAxArrow?.setLength(
        axLen,
        Math.min(0.08, axLen * 0.4),
        Math.min(0.04, axLen * 0.2)
      );

      // Ay arrow (along Three.js X)
      const ayDir = new THREE.Vector3(ay >= 0 ? 1 : -1, 0, 0);
      const ayLen = Math.max(0.02, Math.min(Math.abs(ay) * scale, 1.8));
      this.accelAyArrow?.setDirection(ayDir);
      this.accelAyArrow?.setLength(
        ayLen,
        Math.min(0.08, ayLen * 0.4),
        Math.min(0.04, ayLen * 0.2)
      );

      // Az arrow (along Three.js Y)
      const azDir = new THREE.Vector3(0, az >= 0 ? 1 : -1, 0);
      const azLen = Math.max(0.02, Math.min(Math.abs(az) * scale, 1.8));
      this.accelAzArrow?.setDirection(azDir);
      this.accelAzArrow?.setLength(
        azLen,
        Math.min(0.08, azLen * 0.4),
        Math.min(0.04, azLen * 0.2)
      );
    }

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
