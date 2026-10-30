import { Injectable, signal } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrientationFrame } from '../../../core/utils/madgwick.utils';

/**
 * Service encapsulating the Three.js 3D rendering pipeline for the biomechanical shoe viewer:
 * - Scene graph, perspective camera, WebGL renderer, lights, shadow receiver floor, and grid.
 * - Procedural/GLTF sneaker model loading, caching, and centering.
 * - ISB standard coordinate axes (X red, Y emerald, Z blue), 3D trajectory trail, and dynamic 3D acceleration vectors.
 * - Orbit interaction controls (pointer rotation and wheel zoom), camera tracking, and viewport resizing.
 */
@Injectable()
export class Shoe3dSceneService {
  static readonly DEFAULT_CAMERA_RADIUS = 4.8;
  static readonly SCENE_BASE_Y = -0.35;
  static readonly CAMERA_LOOKAT_Y_OFFSET = 0.65;
  static readonly CAMERA_FOLLOW_LERP = 0.15;
  static readonly MIN_GRID_SIZE = 16;

  readonly hasWebGlError = signal<boolean>(false);
  readonly isModelLoading = signal<boolean>(false);
  readonly showAxes = signal<boolean>(true);
  readonly showAccelVectors = signal<boolean>(true);
  readonly isZoomEnabled = signal<boolean>(false);

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private dirLight: THREE.DirectionalLight | null = null;
  private floorMesh: THREE.Mesh | null = null;
  private shoeGroup: THREE.Group | null = null;
  private axesGroup: THREE.Group | null = null;
  private accelVectorsGroup: THREE.Group | null = null;
  private accelResultantArrow: THREE.ArrowHelper | null = null;
  private accelAxArrow: THREE.ArrowHelper | null = null;
  private accelAyArrow: THREE.ArrowHelper | null = null;
  private accelAzArrow: THREE.ArrowHelper | null = null;
  private trajectoryLine: THREE.Line | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private isDarkTheme = false;
  private gridSize = Shoe3dSceneService.MIN_GRID_SIZE;
  private gridCenter = { x: 0, z: 0 };
  private isPointerDown = false;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private cameraSpherical = {
    radius: Shoe3dSceneService.DEFAULT_CAMERA_RADIUS,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  };
  private cameraTarget = new THREE.Vector3(0, Shoe3dSceneService.SCENE_BASE_Y, 0);
  private shoePosition = new THREE.Vector3(0, Shoe3dSceneService.SCENE_BASE_Y, 0);
  private shoeQuaternion = new THREE.Quaternion();
  private pendingTrajectoryFrames: OrientationFrame[] = [];

  private static cachedSneakerMesh: THREE.Group | null = null;

  init(container: HTMLElement, isDark: boolean): void {
    this.isDarkTheme = isDark;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(isDark ? 0x0f172a : 0xf8fafc);

      // Camera
      this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 500);
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

      this.dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
      this.dirLight.position.set(4, 8, 4);
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 25;
      this.dirLight.shadow.bias = -0.001;
      this.scene.add(this.dirLight);
      this.scene.add(this.dirLight.target);

      // Floor Grid and Shadow Receiver (strictly at Y = 0 in scene base coordinates)
      this.rebuildGrid();

      const floorGeo = new THREE.PlaneGeometry(24, 24);
      const floorMat = new THREE.ShadowMaterial({ opacity: isDark ? 0.35 : 0.15 });
      this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
      this.floorMesh.rotation.x = -Math.PI / 2;
      this.floorMesh.position.y = Shoe3dSceneService.SCENE_BASE_Y - 0.02;
      this.floorMesh.receiveShadow = true;
      this.scene.add(this.floorMesh);

      // Shoe Group
      this.shoeGroup = new THREE.Group();
      this.shoeGroup.position.copy(this.shoePosition);
      this.shoeGroup.quaternion.copy(this.shoeQuaternion);
      this.rebuildModel();
      this.scene.add(this.shoeGroup);

      if (this.pendingTrajectoryFrames.length > 0) {
        this.setTrajectory(this.pendingTrajectoryFrames);
      }

      // Setup Mouse/Touch Orbit Controls & Resize Observer
      this.setupOrbitHandlers(container);
      this.setupResizeObserver(container);

      // Initial Render
      this.render();
    } catch (err) {
      console.error('WebGL initialization error:', err);
      this.hasWebGlError.set(true);
    }
  }

  render(): void {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  toggleAxes(): void {
    this.showAxes.update((v) => !v);
    if (this.axesGroup) {
      this.axesGroup.visible = this.showAxes();
    }
    this.render();
  }

  toggleAccelVectors(): void {
    this.showAccelVectors.update((v) => !v);
    if (this.accelVectorsGroup) {
      this.accelVectorsGroup.visible = this.showAccelVectors();
    }
    this.render();
  }

  enableZoom(): void {
    this.isZoomEnabled.set(true);
  }

  disableZoom(): void {
    this.isZoomEnabled.set(false);
  }

  handleWheelZoom(e: WheelEvent): void {
    if (!this.isZoomEnabled()) return;

    e.preventDefault();
    this.cameraSpherical.radius = Math.max(
      2.0,
      Math.min(9.0, this.cameraSpherical.radius + e.deltaY * 0.003)
    );
    if (!this.camera) return;

    this.updateCameraPosition();
    this.render();
  }

  getCameraRadius(): number {
    return this.cameraSpherical.radius;
  }

  getCameraTarget(): { x: number; y: number; z: number } {
    return {
      x: this.cameraTarget.x,
      y: this.cameraTarget.y,
      z: this.cameraTarget.z,
    };
  }

  getShoePosition(): { x: number; y: number; z: number } {
    return {
      x: this.shoePosition.x,
      y: this.shoePosition.y,
      z: this.shoePosition.z,
    };
  }

  getShoeQuaternion(): { x: number; y: number; z: number; w: number } {
    return {
      x: this.shoeQuaternion.x,
      y: this.shoeQuaternion.y,
      z: this.shoeQuaternion.z,
      w: this.shoeQuaternion.w,
    };
  }

  getGridSize(): number {
    return this.gridSize;
  }

  getGridPosition(): { x: number; y: number; z: number } {
    return {
      x: this.gridCenter.x,
      y: Shoe3dSceneService.SCENE_BASE_Y - 0.01,
      z: this.gridCenter.z,
    };
  }

  resetCameraView(): void {
    this.cameraSpherical = {
      radius: Shoe3dSceneService.DEFAULT_CAMERA_RADIUS,
      theta: Math.PI / 4,
      phi: Math.PI / 3,
    };
    this.updateCameraPosition();
    this.render();
  }

  updateTheme(isDark: boolean): void {
    this.isDarkTheme = isDark;
    if (!this.scene) return;
    this.scene.background = new THREE.Color(isDark ? 0x0f172a : 0xf8fafc);
    this.rebuildGrid();
    this.render();
  }

  private updateAdaptiveGridMetrics(frames: OrientationFrame[]): void {
    let minX = 0;
    let maxX = 0;
    let minZ = 0;
    let maxZ = 0;

    for (const f of frames) {
      const p = f.position;
      if (!p) continue;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }

    // Snap grid center to 0.5-unit cell increments so grid lines stay anchored at (0, 0)
    const centerX = Math.round(((minX + maxX) / 2) / 0.5) * 0.5;
    const centerZ = Math.round(((minZ + maxZ) / 2) / 0.5) * 0.5;

    const halfSpan =
      Math.max(
        Math.abs(maxX - centerX),
        Math.abs(minX - centerX),
        Math.abs(maxZ - centerZ),
        Math.abs(minZ - centerZ)
      ) + 6;

    const rawSize = Math.max(Shoe3dSceneService.MIN_GRID_SIZE, Math.ceil(halfSpan * 2));
    // Ensure even integer size
    this.gridSize = rawSize % 2 === 0 ? rawSize : rawSize + 1;
    this.gridCenter = { x: centerX, z: centerZ };
  }

  private rebuildGrid(): void {
    if (!this.scene) return;

    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper.geometry.dispose();
      (this.gridHelper.material as THREE.Material).dispose();
      this.gridHelper = null;
    }

    const divisions = Math.min(400, Math.max(32, Math.round(this.gridSize * 2)));
    this.gridHelper = new THREE.GridHelper(
      this.gridSize,
      divisions,
      this.isDarkTheme ? 0x38bdf8 : 0x0284c7,
      this.isDarkTheme ? 0x334155 : 0xe2e8f0
    );
    this.gridHelper.position.set(
      this.gridCenter.x,
      Shoe3dSceneService.SCENE_BASE_Y - 0.01,
      this.gridCenter.z
    );
    this.scene.add(this.gridHelper);
  }

  setTrajectory(frames: OrientationFrame[]): void {
    this.pendingTrajectoryFrames = frames;
    this.updateAdaptiveGridMetrics(frames ?? []);
    if (!this.scene) return;

    this.rebuildGrid();

    if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      this.trajectoryLine.geometry.dispose();
      (this.trajectoryLine.material as THREE.Material).dispose();
      this.trajectoryLine = null;
    }

    if (!frames || frames.length < 2) return;

    const points: THREE.Vector3[] = frames.map((f) => {
      const p = f.position ?? { x: 0, y: 0, z: 0 };
      return new THREE.Vector3(
        p.x,
        Shoe3dSceneService.SCENE_BASE_Y + p.y + 0.05,
        p.z
      );
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setDrawRange(0, 1);

    const material = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.75,
    });

    this.trajectoryLine = new THREE.Line(geometry, material);
    this.trajectoryLine.name = 'shoe-trajectory-line';
    this.scene.add(this.trajectoryLine);
  }

  updatePose(
    frame: OrientationFrame | null,
    baseInverseQuat: THREE.Quaternion,
    frameIndex = 0
  ): void {
    if (!frame) return;

    const ax = frame.accel?.ax ?? 0;
    const ay = frame.accel?.ay ?? 0;
    const az = frame.accel?.az ?? 1.0;

    // Position from integrated tri-axial acceleration trajectory
    const pos = frame.position ?? { x: 0, y: 0, z: 0 };
    const worldX = pos.x;
    const worldY = Shoe3dSceneService.SCENE_BASE_Y + pos.y;
    const worldZ = pos.z;

    this.shoePosition.set(worldX, worldY, worldZ);

    // Smooth camera tracking: snap on initial/reset frame (frameIndex === 0), smooth lerp afterwards
    if (frameIndex <= 0) {
      this.cameraTarget.copy(this.shoePosition);
    } else {
      this.cameraTarget.lerp(this.shoePosition, Shoe3dSceneService.CAMERA_FOLLOW_LERP);
    }
    this.updateCameraPosition();

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

    const targetQ = baseInverseQuat.clone().multiply(qRaw);
    this.shoeQuaternion.copy(targetQ);

    if (!this.shoeGroup) return;

    this.shoeGroup.quaternion.copy(targetQ);
    this.shoeGroup.position.copy(this.shoePosition);

    // Keep shadow directional light and floor following the shoe
    if (this.dirLight) {
      this.dirLight.position.set(worldX + 4, worldY + 8, worldZ + 4);
      this.dirLight.target.position.set(worldX, worldY, worldZ);
      this.dirLight.target.updateMatrixWorld();
    }
    if (this.floorMesh) {
      this.floorMesh.position.x = worldX;
      this.floorMesh.position.z = worldZ;
    }

    // Update 3D trajectory trail progress
    if (this.trajectoryLine) {
      this.trajectoryLine.geometry.setDrawRange(0, Math.max(1, frameIndex + 1));
    }

    // Update dynamic acceleration vectors:
    if (this.accelVectorsGroup && this.showAccelVectors()) {
      const scale = 0.55;
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
  }

  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
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
    this.dirLight = null;
    this.floorMesh = null;
    this.shoeGroup = null;
    this.trajectoryLine = null;
  }

  private rebuildModel(): void {
    if (!this.shoeGroup) return;

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

    if (Shoe3dSceneService.cachedSneakerMesh) {
      const clone = Shoe3dSceneService.cachedSneakerMesh.clone(true);
      this.shoeGroup.add(clone);
      this.attachAxesHelper();
      this.render();
      return;
    }

    this.attachAxesHelper();
    this.render();

    try {
      const loader = new GLTFLoader();
      this.isModelLoading.set(true);
      loader.load(
        '/models/blue_sneaker.glb',
        (gltf) => {
          this.isModelLoading.set(false);
          if (!this.shoeGroup) return;

          const model = gltf.scene;
          const bbox = new THREE.Box3().setFromObject(model);
          const size = bbox.getSize(new THREE.Vector3());
          const center = bbox.getCenter(new THREE.Vector3());

          const targetLength = 2.0;
          const scale = size.z > 0 ? targetLength / size.z : 0.068;
          model.scale.set(scale, scale, scale);

          model.position.x = -center.x * scale;
          model.position.y = -bbox.min.y * scale;
          model.position.z = -center.z * scale + 0.15;

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          const container = new THREE.Group();
          container.add(model);
          Shoe3dSceneService.cachedSneakerMesh = container;

          this.shoeGroup.add(container.clone(true));
          this.attachAxesHelper();
          this.render();
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

  private buildAxesHelper(): THREE.Group {
    const axes = new THREE.Group();
    axes.name = 'isb-axes';
    axes.position.set(0, 0.45, 0);

    const axisLength = 0.8;
    const shaftRadius = 0.018;
    const coneHeight = 0.16;
    const coneRadius = 0.055;

    const centerSphereGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const centerSphere = new THREE.Mesh(centerSphereGeo, centerMat);
    axes.add(centerSphere);

    // X Axis (Antéro-postérieur / Avant) -> along +Z (Red 0xef4444)
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

    // Y Axis (Médio-latéral / Droite) -> along +X (Emerald 0x10b981)
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

    // Z Axis (Longitudinal / Vertical / Haut) -> along +Y (Blue 0x3b82f6)
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
      this.render();
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
  }

  private updateCameraPosition(): void {
    if (!this.camera) return;
    const { radius, theta, phi } = this.cameraSpherical;
    const offsetX = radius * Math.sin(phi) * Math.sin(theta);
    const offsetY = radius * Math.cos(phi);
    const offsetZ = radius * Math.sin(phi) * Math.cos(theta);

    const lookAtX = this.cameraTarget.x;
    const lookAtY = this.cameraTarget.y + Shoe3dSceneService.CAMERA_LOOKAT_Y_OFFSET;
    const lookAtZ = this.cameraTarget.z;

    this.camera.position.set(
      lookAtX + offsetX,
      lookAtY + offsetY,
      lookAtZ + offsetZ
    );
    this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
  }

  private setupResizeObserver(container: HTMLElement): void {
    if (!window.ResizeObserver) return;
    this.resizeObserver = new ResizeObserver(() => {
      if (!container || !this.renderer || !this.camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.render();
      }
    });
    this.resizeObserver.observe(container);
  }
}
