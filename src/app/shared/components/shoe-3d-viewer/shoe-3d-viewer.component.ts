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
  readonly liveGaitPhase = signal<GaitPhase>('neutral');
  readonly liveAccelMag = signal<number>(1.0);
  readonly hasWebGlError = signal<boolean>(false);
  readonly showAxes = signal<boolean>(true);
  readonly selectedModel = signal<'sneaker' | 'insole'>('sneaker');

  // Playback speeds
  readonly speedOptions: number[] = [0.25, 0.5, 1.0, 2.0];

  // Three.js instances
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private shoeGroup: THREE.Group | null = null;
  private axesGroup: THREE.Group | null = null;
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

  private cachedSneakerMesh: THREE.Group | null = null;
  readonly isModelLoading = signal(false);

  setModel(model: 'sneaker' | 'insole'): void {
    if (this.selectedModel() === model) return;
    this.selectedModel.set(model);
    this.rebuildModel();
    this.renderScene();
  }

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

    if (this.selectedModel() === 'insole') {
      const modelMesh = this.buildProceduralInsoleMesh();
      this.shoeGroup.add(modelMesh);
      this.attachAxesHelper();
      this.renderScene();
    } else {
      this.loadSneakerModel();
    }
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

    // Add clean procedural fallback while GLB is being loaded or if offline/test
    const fallback = this.buildProceduralShoe();
    fallback.name = 'sneaker-fallback';
    this.shoeGroup.add(fallback);
    this.attachAxesHelper();
    this.renderScene();

    try {
      const loader = new GLTFLoader();
      this.isModelLoading.set(true);
      loader.load(
        '/models/blue_sneaker.glb',
        (gltf) => {
          this.isModelLoading.set(false);
          if (!this.shoeGroup || this.selectedModel() !== 'sneaker') return;

          // Remove the fallback
          const fb = this.shoeGroup.getObjectByName('sneaker-fallback');
          if (fb) {
            this.shoeGroup.remove(fb);
          }

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
          console.warn('Could not load /models/blue_sneaker.glb, keeping fallback:', err);
          this.isModelLoading.set(false);
        }
      );
    } catch (e) {
      console.warn('GLTFLoader error, keeping fallback:', e);
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
   * Constructs an anatomical athletic sneaker model using Three.js geometric primitives.
   * Pivot is placed near the ankle/subtalar joint for biomechanically accurate rotations.
   */
  private buildProceduralShoe(): THREE.Group {
    const root = new THREE.Group();

    // Shared materials
    const outsoleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark charcoal rubber
      roughness: 0.85,
    });
    const midsoleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Crisp white foam
      roughness: 0.35,
    });
    const upperMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Deep royal athletic blue
      roughness: 0.6,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant cyan accent
      roughness: 0.4,
    });
    const laceMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.5,
    });
    const clipMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Black hardware clip
      metalness: 0.6,
      roughness: 0.25,
    });
    const ledMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Glowing emerald LED
    });

    // 1. Outsole (Base sole contact)
    const outsoleGeo = new THREE.BoxGeometry(0.72, 0.08, 1.9);
    const outsole = new THREE.Mesh(outsoleGeo, outsoleMat);
    outsole.position.set(0, 0.04, 0.15);
    outsole.castShadow = true;
    outsole.receiveShadow = true;
    root.add(outsole);

    // 2. Midsole Wedge (Cushioned running wedge, thicker at heel)
    const midsoleGeo = new THREE.BoxGeometry(0.7, 0.12, 1.85);
    const midsole = new THREE.Mesh(midsoleGeo, midsoleMat);
    midsole.position.set(0, 0.14, 0.15);
    midsole.castShadow = true;
    root.add(midsole);

    // 3. Forefoot & Toe Cap (Curved front rocker)
    const toeGeo = new THREE.CylinderGeometry(0.34, 0.35, 0.7, 16);
    toeGeo.rotateZ(Math.PI / 2);
    const toe = new THREE.Mesh(toeGeo, accentMat);
    toe.position.set(0, 0.24, 0.82);
    toe.scale.set(0.9, 0.7, 1.3);
    toe.castShadow = true;
    root.add(toe);

    // 4. Main Body / Mesh Upper
    const upperGeo = new THREE.BoxGeometry(0.68, 0.28, 1.5);
    const upper = new THREE.Mesh(upperGeo, upperMat);
    upper.position.set(0, 0.32, 0.12);
    upper.castShadow = true;
    root.add(upper);

    // 5. Heel Counter (Reinforced rear support)
    const heelCounterGeo = new THREE.CylinderGeometry(0.33, 0.34, 0.32, 16);
    const heelCounter = new THREE.Mesh(heelCounterGeo, accentMat);
    heelCounter.position.set(0, 0.34, -0.5);
    heelCounter.scale.set(0.95, 1.0, 1.1);
    heelCounter.castShadow = true;
    root.add(heelCounter);

    // 6. Tongue and Lacing System
    const tongueGeo = new THREE.BoxGeometry(0.32, 0.16, 0.7);
    const tongue = new THREE.Mesh(tongueGeo, accentMat);
    tongue.position.set(0, 0.44, 0.32);
    tongue.rotation.x = -Math.PI / 7;
    tongue.castShadow = true;
    root.add(tongue);

    // Crossing laces bars
    for (let i = 0; i < 4; i++) {
      const laceGeo = new THREE.BoxGeometry(0.38, 0.02, 0.04);
      const lace = new THREE.Mesh(laceGeo, laceMat);
      lace.position.set(0, 0.43 + i * 0.04, 0.18 + i * 0.12);
      lace.rotation.x = -Math.PI / 7;
      root.add(lace);
    }

    // 7. Ankle Collar
    const collarGeo = new THREE.TorusGeometry(0.24, 0.06, 8, 20);
    collarGeo.rotateX(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeo, outsoleMat);
    collar.position.set(0, 0.52, -0.28);
    collar.scale.set(1.0, 1.0, 1.3);
    root.add(collar);

    return root;
  }

  /**
   * Constructs an anatomical orthotic insole (semelle biomécanique clinique)
   * with arch contour, heel cup, and distinct color-coded FSR pressure sensor pads.
   */
  private buildProceduralInsoleMesh(): THREE.Group {
    const root = new THREE.Group();

    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep slate core
      roughness: 0.8,
    });
    const topCoverMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Technical EVA cushion
      roughness: 0.6,
    });
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Dynamic arch bridge
      roughness: 0.4,
    });
    const heelSensorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan heel strike sensor
      roughness: 0.2,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.35,
    });
    const meta1SensorMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber 1st metatarsal sensor
      roughness: 0.2,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.35,
    });
    const meta5SensorMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald 5th metatarsal sensor
      roughness: 0.2,
      emissive: 0x10b981,
      emissiveIntensity: 0.35,
    });
    const toeSensorMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6, // Purple big toe sensor
      roughness: 0.2,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.35,
    });
    const clipMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e24,
      metalness: 0.7,
      roughness: 0.3,
    });
    const ledMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Glowing emerald LED
    });

    // 1. Base Insole Plates (Anatomical footprint)
    const heelPlateGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24);
    const heelPlate = new THREE.Mesh(heelPlateGeo, baseMat);
    heelPlate.position.set(0, 0.025, -0.45);
    heelPlate.scale.set(0.95, 1, 1.1);
    heelPlate.castShadow = true;
    heelPlate.receiveShadow = true;
    root.add(heelPlate);

    const midfootPlateGeo = new THREE.BoxGeometry(0.56, 0.05, 0.7);
    const midfootPlate = new THREE.Mesh(midfootPlateGeo, baseMat);
    midfootPlate.position.set(0, 0.025, 0.0);
    midfootPlate.castShadow = true;
    root.add(midfootPlate);

    const forefootPlateGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.05, 24);
    const forefootPlate = new THREE.Mesh(forefootPlateGeo, baseMat);
    forefootPlate.position.set(0, 0.025, 0.55);
    forefootPlate.scale.set(0.98, 1, 1.25);
    forefootPlate.castShadow = true;
    root.add(forefootPlate);

    // 2. Medial Arch Support Contour
    const archGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.45, 16);
    archGeo.rotateZ(Math.PI / 2);
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(-0.22, 0.06, 0.02);
    arch.scale.set(1.1, 0.6, 1.3);
    arch.castShadow = true;
    root.add(arch);

    // 3. Deep Heel Cup Contours
    const heelRimGeo = new THREE.TorusGeometry(0.3, 0.04, 12, 24, Math.PI);
    heelRimGeo.rotateX(Math.PI / 2);
    heelRimGeo.rotateZ(Math.PI / 2);
    const heelRim = new THREE.Mesh(heelRimGeo, topCoverMat);
    heelRim.position.set(0, 0.06, -0.48);
    heelRim.scale.set(0.92, 1, 1.15);
    root.add(heelRim);

    // 4. Clinical FSR Pressure Sensor Pads
    const heelSensorGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.015, 20);
    const heelSensor = new THREE.Mesh(heelSensorGeo, heelSensorMat);
    heelSensor.position.set(0, 0.055, -0.42);
    root.add(heelSensor);

    const meta1SensorGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.015, 18);
    const meta1Sensor = new THREE.Mesh(meta1SensorGeo, meta1SensorMat);
    meta1Sensor.position.set(-0.16, 0.055, 0.45);
    root.add(meta1Sensor);

    const meta5SensorGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.015, 18);
    const meta5Sensor = new THREE.Mesh(meta5SensorGeo, meta5SensorMat);
    meta5Sensor.position.set(0.18, 0.055, 0.42);
    root.add(meta5Sensor);

    const toeSensorGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.015, 18);
    const toeSensor = new THREE.Mesh(toeSensorGeo, toeSensorMat);
    toeSensor.position.set(-0.12, 0.055, 0.78);
    root.add(toeSensor);

    // 5. Lateral Electronics Clip with Status LED
    const clipGeo = new THREE.BoxGeometry(0.12, 0.16, 0.22);
    const clip = new THREE.Mesh(clipGeo, clipMat);
    clip.position.set(0.32, 0.08, -0.25);
    clip.castShadow = true;
    root.add(clip);

    const ledGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.385, 0.12, -0.25);
    root.add(led);

    return root;
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

    // Elevation bobbing according to gait phase & vertical acceleration
    let verticalOffset = 0;
    if (frame.gaitPhase === 'heel_strike') {
      verticalOffset = 0.08;
    } else if (frame.gaitPhase === 'toe_off') {
      verticalOffset = 0.12;
    } else if (frame.gaitPhase === 'swing') {
      verticalOffset = 0.16;
    }
    this.shoeGroup.position.y = verticalOffset;

    // Update Live HUD Metrics
    this.livePitchDeg.set(Math.round(frame.euler.pitch * 10) / 10);
    this.liveRollDeg.set(Math.round(frame.euler.roll * 10) / 10);
    this.liveYawDeg.set(Math.round(frame.euler.yaw * 10) / 10);
    this.liveGaitPhase.set(frame.gaitPhase);
    this.liveAccelMag.set(Math.round(frame.accelMag * 100) / 100);
  }
}
