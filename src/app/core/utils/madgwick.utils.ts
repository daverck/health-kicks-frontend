import { ImuReading } from '../../models/telemetry.models';

export type GaitPhase = 'heel_strike' | 'flat_foot' | 'toe_off' | 'swing' | 'neutral';

export interface OrientationFrame {
  timeSec: number;
  q: { w: number; x: number; y: number; z: number };
  euler: { roll: number; pitch: number; yaw: number };
  gaitPhase: GaitPhase;
  accelMag: number;
  gyroMag: number;
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

/**
 * Pre-computes orientation quaternions and biomechanical angles for a complete IMU session.
 */
export function computeOrientationTrajectory(
  readings: ImuReading[],
  beta = 0.05
): OrientationFrame[] {
  if (!readings || readings.length === 0) return [];

  const filter = new MadgwickFilter(beta);
  const trajectory: OrientationFrame[] = [];
  const t0 = readings[0].timestamp_epoch_us;

  // Let filter converge on initial accelerometer direction (gravity vector)
  const r0 = readings[0];
  const a0Mag = Math.sqrt(r0.ax * r0.ax + r0.ay * r0.ay + r0.az * r0.az);
  if (a0Mag > 0.1) {
    for (let i = 0; i < 30; i++) {
      filter.update(r0.ax, r0.ay, r0.az, 0, 0, 0, 0.02);
    }
  }

  const toRad = Math.PI / 180;

  for (let i = 0; i < readings.length; i++) {
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

    // Readings from MPU-6050 are in deg/s; Madgwick expects rad/s
    const gx = r.gx * toRad;
    const gy = r.gy * toRad;
    const gz = r.gz * toRad;

    const accelMag = Math.sqrt(r.ax * r.ax + r.ay * r.ay + r.az * r.az);
    const gyroMag = Math.sqrt(gx * gx + gy * gy + gz * gz);

    // Dynamic gravity gating: only apply accelerometer correction when close to 1.0g
    // During impact shocks or high dynamics (> 1.25g or < 0.75g), rely purely on gyro integration
    // to prevent violent orientation flips
    const isStationaryOrSteady = Math.abs(accelMag - 1.0) < 0.25;
    const ax = isStationaryOrSteady ? r.ax : 0;
    const ay = isStationaryOrSteady ? r.ay : 0;
    const az = isStationaryOrSteady ? r.az : 0;

    const q = filter.update(ax, ay, az, gx, gy, gz, dt);
    const euler = quaternionToEulerDeg(q);
    const gaitPhase = classifyGaitPhase(euler.pitch, accelMag, gyroMag);

    trajectory.push({
      timeSec,
      q: { ...q },
      euler,
      gaitPhase,
      accelMag,
      gyroMag,
    });
  }

  return trajectory;
}
