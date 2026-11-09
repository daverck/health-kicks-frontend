import * as THREE from 'three';

/**
 * Factory service constructing visual helpers for the 3D shoe viewer:
 * - ISB standard anatomical reference axes (X red forward, Y emerald right, Z blue upward).
 * - Dynamic acceleration vectors (Resultant, Ax, Ay, Az).
 */
export class Shoe3dVisualHelpersFactory {
  static buildAxesHelper(): THREE.Group {
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

    // X Axis (Antero-posterior / Forward) -> along +Z (Red 0xef4444)
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

    // Y Axis (Medio-lateral / Right) -> along +X (Emerald 0x10b981)
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

  static buildAccelVectors(): {
    group: THREE.Group;
    resultant: THREE.ArrowHelper;
    ax: THREE.ArrowHelper;
    ay: THREE.ArrowHelper;
    az: THREE.ArrowHelper;
  } {
    const group = new THREE.Group();
    group.name = 'accel-vectors';
    group.position.set(0, 0.45, 0);

    const resultant = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      0.6,
      0xa855f7,
      0.16,
      0.08
    );
    group.add(resultant);

    const ax = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      0.2,
      0xef4444,
      0.1,
      0.05
    );
    group.add(ax);

    const ay = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      0.2,
      0x10b981,
      0.1,
      0.05
    );
    group.add(ay);

    const az = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      0.5,
      0x3b82f6,
      0.1,
      0.05
    );
    group.add(az);

    return { group, resultant, ax, ay, az };
  }
}
