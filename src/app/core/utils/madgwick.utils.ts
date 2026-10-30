import { ImuReading } from '../../models/telemetry.models';

export type GaitPhase = 'heel_strike' | 'flat_foot' | 'toe_off' | 'swing' | 'neutral';

export interface OrientationFrame {
  timeSec: number;
  q: { w: number; x: number; y: number; z: number };
  euler: { roll: number; pitch: number; yaw: number };
  gaitPhase: GaitPhase;
  accelMag: number;
  gyroMag: number;
  accel?: { ax: number; ay: number; az: number };
  position: { x: number; y: number; z: number };
}

/**
 * 6-DOF Madgwick AHRS (Attitude and Heading Reference System) filter.
 * Computes orientation quaternion (q0, q1, q2, q3) from tri-axis accelerometer and gyroscope.
 */
export class MadgwickFilter {
  q0 = 1.0;
  q1 = 0.0;
  q2 = 0.0;
  q3 = 0.0;
  beta: number;

  constructor(beta = 0.1) {
    this.beta = beta;
  }

  reset(q0 = 1.0, q1 = 0.0, q2 = 0.0, q3 = 0.0): void {
    this.q0 = q0;
    this.q1 = q1;
    this.q2 = q2;
    this.q3 = q3;
  }

  update(
    ax: number,
    ay: number,
    az: number,
    gx: number,
    gy: number,
    gz: number,
    dt: number
  ): { w: number; x: number; y: number; z: number } {
    let q0 = this.q0;
    let q1 = this.q1;
    let q2 = this.q2;
    let q3 = this.q3;

    // Rate of change of quaternion from gyroscope
    let qDot0 = 0.5 * (-q1 * gx - q2 * gy - q3 * gz);
    let qDot1 = 0.5 * (q0 * gx + q2 * gz - q3 * gy);
    let qDot2 = 0.5 * (q0 * gy - q1 * gz + q3 * gx);
    let qDot3 = 0.5 * (q0 * gz + q1 * gy - q2 * gx);

    // Compute feedback only if accelerometer measurement valid (avoids NaN in normalisation)
    const accelNormSq = ax * ax + ay * ay + az * az;
    if (accelNormSq > 1e-6) {
      const recipNorm = 1.0 / Math.sqrt(accelNormSq);
      ax *= recipNorm;
      ay *= recipNorm;
      az *= recipNorm;

      // Auxiliary variables to avoid repeated arithmetic
      const _2q0 = 2.0 * q0;
      const _2q1 = 2.0 * q1;
      const _2q2 = 2.0 * q2;
      const _2q3 = 2.0 * q3;
      const _4q0 = 4.0 * q0;
      const _4q1 = 4.0 * q1;
      const _4q2 = 4.0 * q2;
      const _8q1 = 8.0 * q1;
      const _8q2 = 8.0 * q2;
      const q0q0 = q0 * q0;
      const q1q1 = q1 * q1;
      const q2q2 = q2 * q2;
      const q3q3 = q3 * q3;

      // Gradient descent algorithm corrective step
      let s0 = _4q0 * q2q2 + _2q2 * ax + _4q0 * q1q1 - _2q1 * ay;
      let s1 = _4q1 * q3q3 - _2q3 * ax + 4.0 * q0q0 * q1 - _2q0 * ay - _4q1 + _8q1 * q1q1 + _8q1 * q2q2 + _4q1 * az;
      let s2 = 4.0 * q0q0 * q2 + _2q0 * ax + _4q2 * q3q3 - _2q3 * ay - _4q2 + _8q2 * q1q1 + _8q2 * q2q2 + _4q2 * az;
      let s3 = 4.0 * q1q1 * q3 - _2q1 * ax + 4.0 * q2q2 * q3 - _2q2 * ay;

      const sNormSq = s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3;
      if (sNormSq > 1e-9) {
        const recipS = 1.0 / Math.sqrt(sNormSq);
        s0 *= recipS;
        s1 *= recipS;
        s2 *= recipS;
        s3 *= recipS;

        // Apply feedback step
        qDot0 -= this.beta * s0;
        qDot1 -= this.beta * s1;
        qDot2 -= this.beta * s2;
        qDot3 -= this.beta * s3;
      }
    }

    // Integrate rate of change of quaternion to yield quaternion
    q0 += qDot0 * dt;
    q1 += qDot1 * dt;
    q2 += qDot2 * dt;
    q3 += qDot3 * dt;

    // Normalise quaternion
    const qNormSq = q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3;
    const recipQ = 1.0 / Math.sqrt(qNormSq);
    this.q0 = q0 * recipQ;
    this.q1 = q1 * recipQ;
    this.q2 = q2 * recipQ;
    this.q3 = q3 * recipQ;

    return { w: this.q0, x: this.q1, y: this.q2, z: this.q3 };
  }
}

/**
 * Computes the analytical shortest-arc quaternion (with zero yaw twist, z = 0)
 * that aligns the measured 3-axis gravity reaction vector (ax, ay, az) in the ISB sensor frame
 * with the world vertical reference (0, 0, +1).
 *
 * This quaternion is the exact equilibrium fixed point of the Madgwick objective function
 * and avoids any gimbal-lock discontinuity at +-90 deg pitch (lying_supine / lying_prone)
 * or +-90 deg roll (lying_lateral).
 */
export function computeInitialQuaternionFromGravity(
  ax: number,
  ay: number,
  az: number
): { w: number; x: number; y: number; z: number } {
  const norm = Math.sqrt(ax * ax + ay * ay + az * az);
  if (norm < 1e-6) {
    return { w: 1, x: 0, y: 0, z: 0 };
  }
  const nx = ax / norm;
  const ny = ay / norm;
  const nz = az / norm;

  // Antipodal case (shoe completely inverted upside-down: nz -> -1)
  if (nz < -0.999999) {
    return { w: 0, x: 1, y: 0, z: 0 };
  }

  const w = Math.sqrt((1.0 + nz) * 0.5);
  const inv2w = 0.5 / w;
  return {
    w,
    x: ny * inv2w,
    y: -nx * inv2w,
    z: 0,
  };
}

/**
 * Convert quaternion to Tait-Bryan Euler angles in degrees (Roll, Pitch, Yaw).
 * Roll: X-axis rotation (Inversion / Eversion / Pronation / Supination)
 * Pitch: Y-axis rotation (Dorsiflexion / Plantarflexion / Heel Strike / Toe Off)
 * Yaw: Z-axis rotation (Foot Progression Angle)
 */
export function quaternionToEulerDeg(q: { w: number; x: number; y: number; z: number }): {
  roll: number;
  pitch: number;
  yaw: number;
} {
  const { w, x, y, z } = q;

  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const rollRad = Math.atan2(sinr_cosp, cosr_cosp);

  // Pitch (y-axis rotation)
  const sinp = 2 * (w * y - z * x);
  let pitchRad: number;
  if (Math.abs(sinp) >= 1) {
    pitchRad = sinp > 0 ? Math.PI / 2 : -Math.PI / 2;
  } else {
    pitchRad = Math.asin(sinp);
  }

  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yawRad = Math.atan2(siny_cosp, cosy_cosp);

  const radToDeg = 180 / Math.PI;
  return {
    roll: rollRad * radToDeg,
    pitch: pitchRad * radToDeg,
    yaw: yawRad * radToDeg,
  };
}

/**
 * Biomechanical gait classification based on pitch angle, acceleration norm, and gyro speed.
 */
export function classifyGaitPhase(
  pitchDeg: number,
  accelMag: number,
  gyroMag: number
): GaitPhase {
  if (pitchDeg > 8 && accelMag > 1.1) {
    return 'heel_strike';
  } else if (pitchDeg < -10 && gyroMag > 1.0) {
    return 'toe_off';
  } else if (Math.abs(pitchDeg) <= 6 && gyroMag < 0.8) {
    return 'flat_foot';
  } else if (gyroMag >= 1.2) {
    return 'swing';
  }
  return 'neutral';
}

function rotateVectorByQuat(
  v: { x: number; y: number; z: number },
  q: { w: number; x: number; y: number; z: number }
): { x: number; y: number; z: number } {
  const tx = 2 * (q.y * v.z - q.z * v.y);
  const ty = 2 * (q.z * v.x - q.x * v.z);
  const tz = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

const GRAVITY_WINDOW_MAX_SAMPLES = 5;
const GRAVITY_WINDOW_MAX_DURATION_US = 200_000; // 200 ms

/**
 * Estimates the local 3-axis gravity vector at index `idx` by averaging quasi-static samples
 * within a short temporal window (~200 ms, up to 5 samples).
 * - At t = 0 (`idx === 0`), averages consecutive quasi-static samples from the start of the session.
 * - For `idx > 0`, averages quasi-static samples in the trailing window `[start .. idx]`.
 */
function estimateWindowedGravity(
  readings: ImuReading[],
  idx: number
): { ax: number; ay: number; az: number; isQuasiStatic: boolean } {
  const toRad = Math.PI / 180;
  const current = readings[idx];
  const currentAccelMag = Math.sqrt(
    current.ax * current.ax + current.ay * current.ay + current.az * current.az
  );
  const currentGyroMag =
    Math.sqrt(
      current.gx * current.gx + current.gy * current.gy + current.gz * current.gz
    ) * toRad;
  const currentIsStatic =
    Math.abs(currentAccelMag - 1.0) < 0.25 && currentGyroMag < 0.8;

  if (idx === 0) {
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let count = 0;
    const tStart = current.timestamp_epoch_us;

    for (
      let k = 0;
      k < Math.min(readings.length, GRAVITY_WINDOW_MAX_SAMPLES);
      k++
    ) {
      const r = readings[k];
      if (r.timestamp_epoch_us - tStart > GRAVITY_WINDOW_MAX_DURATION_US) {
        break;
      }
      const aMag = Math.sqrt(r.ax * r.ax + r.ay * r.ay + r.az * r.az);
      const gMag =
        Math.sqrt(r.gx * r.gx + r.gy * r.gy + r.gz * r.gz) * toRad;
      if (Math.abs(aMag - 1.0) < 0.25 && gMag < 0.8) {
        sumX += r.ax;
        sumY += r.ay;
        sumZ += r.az;
        count++;
      } else {
        break;
      }
    }

    if (count > 0) {
      return {
        ax: sumX / count,
        ay: sumY / count,
        az: sumZ / count,
        isQuasiStatic: true,
      };
    }
    return {
      ax: current.ax,
      ay: current.ay,
      az: current.az,
      isQuasiStatic: currentIsStatic,
    };
  }

  if (!currentIsStatic) {
    return {
      ax: current.ax,
      ay: current.ay,
      az: current.az,
      isQuasiStatic: false,
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  let count = 0;
  const tCurrent = current.timestamp_epoch_us;
  const minIndex = Math.max(0, idx - GRAVITY_WINDOW_MAX_SAMPLES + 1);

  for (let k = idx; k >= minIndex; k--) {
    const r = readings[k];
    if (tCurrent - r.timestamp_epoch_us > GRAVITY_WINDOW_MAX_DURATION_US) {
      break;
    }
    const aMag = Math.sqrt(r.ax * r.ax + r.ay * r.ay + r.az * r.az);
    const gMag =
      Math.sqrt(r.gx * r.gx + r.gy * r.gy + r.gz * r.gz) * toRad;
    if (Math.abs(aMag - 1.0) < 0.25 && gMag < 0.8) {
      sumX += r.ax;
      sumY += r.ay;
      sumZ += r.az;
      count++;
    } else {
      break;
    }
  }

  if (count > 0) {
    return {
      ax: sumX / count,
      ay: sumY / count,
      az: sumZ / count,
      isQuasiStatic: true,
    };
  }

  return {
    ax: current.ax,
    ay: current.ay,
    az: current.az,
    isQuasiStatic: true,
  };
}

/**
 * Pre-computes orientation quaternions, biomechanical angles, and 3D spatial trajectory
 * from tri-axial accelerations (AX, AY, AZ) using ZUPT and linear velocity de-drifting
 * between stance phases (preserving negative/positive Y for stair descent/ascent).
 */
export function computeOrientationTrajectory(
  readings: ImuReading[],
  beta = 0.05
): OrientationFrame[] {
  if (!readings || readings.length === 0) return [];

  const filter = new MadgwickFilter(beta);
  const trajectory: OrientationFrame[] = [];
  const t0 = readings[0].timestamp_epoch_us;

  // Directly initialize filter orientation at t = 0 from the windowed 3-axis gravity distribution
  const initialGravity = estimateWindowedGravity(readings, 0);
  const a0Mag = Math.sqrt(
    initialGravity.ax * initialGravity.ax +
      initialGravity.ay * initialGravity.ay +
      initialGravity.az * initialGravity.az
  );
  if (a0Mag > 0.1) {
    const qInit = computeInitialQuaternionFromGravity(
      initialGravity.ax,
      initialGravity.ay,
      initialGravity.az
    );
    filter.reset(qInit.w, qInit.x, qInit.y, qInit.z);
  }

  const toRad = Math.PI / 180;
  let baselineWorldAccel = { x: 0, y: 1.0, z: 0 };

  // Visual scale factor converting g (9.81 m/s^2) into Three.js scene units/s^2
  // (where the sneaker length is 2.0 units)
  const ACCEL_SCENE_SCALE = 14.0;
  const DEADZONE_G = 0.04;

  const n = readings.length;
  const dts = new Array<number>(n).fill(0.02);
  const linAccels = new Array<{ x: number; y: number; z: number }>(n);
  const isZuptFlags = new Array<boolean>(n).fill(false);

  // Pass 1: Orientation estimation, world-frame linear acceleration & ZUPT detection
  for (let i = 0; i < n; i++) {
    const r = readings[i];
    const timeSec = (r.timestamp_epoch_us - t0) / 1_000_000;

    let dt = 0.02; // default 50Hz (20ms)
    if (i > 0) {
      const prev = readings[i - 1];
      const deltaUs = r.timestamp_epoch_us - prev.timestamp_epoch_us;
      if (deltaUs > 1000 && deltaUs < 1_000_000) {
        dt = deltaUs / 1_000_000;
      }
    }
    dts[i] = dt;

    // Readings from MPU-6050 are in deg/s; Madgwick expects rad/s
    const gx = r.gx * toRad;
    const gy = r.gy * toRad;
    const gz = r.gz * toRad;

    const accelMag = Math.sqrt(r.ax * r.ax + r.ay * r.ay + r.az * r.az);
    const gyroMag = Math.sqrt(gx * gx + gy * gy + gz * gz);

    // Periodic / sliding-window gravity estimation (~200 ms window) when quasi-static
    const windowedG = estimateWindowedGravity(readings, i);
    const isStationaryOrSteady =
      Math.abs(accelMag - 1.0) < 0.25 && windowedG.isQuasiStatic;
    const ax = isStationaryOrSteady ? windowedG.ax : 0;
    const ay = isStationaryOrSteady ? windowedG.ay : 0;
    const az = isStationaryOrSteady ? windowedG.az : 0;

    const q =
      i === 0 && a0Mag > 0.1
        ? { w: filter.q0, x: filter.q1, y: filter.q2, z: filter.q3 }
        : filter.update(ax, ay, az, gx, gy, gz, dt);
    const euler = quaternionToEulerDeg(q);
    const gaitPhase = classifyGaitPhase(euler.pitch, accelMag, gyroMag);

    // Map quaternion to Three.js scene space (X <- q.y, Y <- q.z, Z <- q.x)
    const qScene = { w: q.w, x: q.y, y: q.z, z: q.x };
    const localAccelScene = { x: r.ay, y: r.az, z: r.ax };
    const worldAccel = rotateVectorByQuat(localAccelScene, qScene);

    if (i === 0) {
      const initWorldGravity = rotateVectorByQuat(
        { x: initialGravity.ay, y: initialGravity.az, z: initialGravity.ax },
        qScene
      );
      baselineWorldAccel = initWorldGravity;
      linAccels[i] = { x: 0, y: 0, z: 0 };
      isZuptFlags[i] = true;
    } else {
      const isZupt =
        (gaitPhase === 'flat_foot' || gaitPhase === 'neutral') &&
        Math.abs(accelMag - 1.0) < 0.12 &&
        gyroMag < 0.6;
      isZuptFlags[i] = isZupt;

      if (isZupt && windowedG.isQuasiStatic) {
        const windowedWorldG = rotateVectorByQuat(
          { x: windowedG.ay, y: windowedG.az, z: windowedG.ax },
          qScene
        );
        baselineWorldAccel = {
          x: baselineWorldAccel.x * 0.8 + windowedWorldG.x * 0.2,
          y: baselineWorldAccel.y * 0.8 + windowedWorldG.y * 0.2,
          z: baselineWorldAccel.z * 0.8 + windowedWorldG.z * 0.2,
        };
      }

      let linX = worldAccel.x - baselineWorldAccel.x;
      let linY = worldAccel.y - baselineWorldAccel.y;
      let linZ = worldAccel.z - baselineWorldAccel.z;

      if (Math.abs(linX) < DEADZONE_G) linX = 0;
      if (Math.abs(linY) < DEADZONE_G) linY = 0;
      if (Math.abs(linZ) < DEADZONE_G) linZ = 0;

      linAccels[i] = { x: linX, y: linY, z: linZ };
    }

    trajectory.push({
      timeSec,
      q: { ...q },
      euler,
      gaitPhase,
      accelMag,
      gyroMag,
      accel: { ax: r.ax, ay: r.ay, az: r.az },
      position: { x: 0, y: 0, z: 0 },
    });
  }

  // Pass 2: Velocity integration with ZUPT and linear velocity de-drifting per movement segment
  const velocities = new Array<{ x: number; y: number; z: number }>(n);
  for (let i = 0; i < n; i++) {
    velocities[i] = { x: 0, y: 0, z: 0 };
  }

  let idx = 0;
  while (idx < n) {
    if (isZuptFlags[idx]) {
      velocities[idx] = { x: 0, y: 0, z: 0 };
      idx++;
      continue;
    }

    // Start of a movement segment: the anchor is the last stationary frame (idx - 1)
    const startIdx = Math.max(0, idx - 1);
    let endIdx = idx;
    while (endIdx < n && !isZuptFlags[endIdx]) {
      endIdx++;
    }

    // Integrate raw velocity across the movement segment without artificial decay
    let vx = 0;
    let vy = 0;
    let vz = 0;
    for (let k = idx; k <= Math.min(endIdx, n - 1); k++) {
      const dt = dts[k];
      const a = linAccels[k];
      vx += a.x * ACCEL_SCENE_SCALE * dt;
      vy += a.y * ACCEL_SCENE_SCALE * dt;
      vz += a.z * ACCEL_SCENE_SCALE * dt;
      velocities[k] = { x: vx, y: vy, z: vz };
    }

    // If the movement segment ends at a stationary ZUPT frame (endIdx < n),
    // linearly remove residual impact velocity drift over [startIdx, endIdx]
    if (endIdx < n && isZuptFlags[endIdx]) {
      const tStart = trajectory[startIdx].timeSec;
      const tEnd = trajectory[endIdx].timeSec;
      const duration = tEnd - tStart;
      const errVel = velocities[endIdx];

      if (duration > 1e-6) {
        for (let k = idx; k < endIdx; k++) {
          const alpha = (trajectory[k].timeSec - tStart) / duration;
          velocities[k].x -= errVel.x * alpha;
          velocities[k].y -= errVel.y * alpha;
          velocities[k].z -= errVel.z * alpha;
        }
      }
      velocities[endIdx] = { x: 0, y: 0, z: 0 };
      idx = endIdx + 1;
    } else {
      idx = endIdx;
    }
  }

  // Pass 3: Integrate corrected velocities into 3D positions (keeping Y < 0 and Y > 0 unrestricted)
  let posX = 0;
  let posY = 0;
  let posZ = 0;
  for (let i = 1; i < n; i++) {
    const dt = dts[i];
    posX += velocities[i].x * dt;
    posY += velocities[i].y * dt;
    posZ += velocities[i].z * dt;
    trajectory[i].position = { x: posX, y: posY, z: posZ };
  }

  return trajectory;
}
