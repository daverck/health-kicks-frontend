import {
  MadgwickFilter,
  quaternionToEulerDeg,
  classifyGaitPhase,
  computeOrientationTrajectory,
} from './madgwick.utils';
import { ImuReading } from '../../models/telemetry.models';

describe('MadgwickUtils', () => {
  describe('MadgwickFilter', () => {
    it('should initialize with identity quaternion', () => {
      const filter = new MadgwickFilter(0.1);
      expect(filter.q0).toBe(1.0);
      expect(filter.q1).toBe(0.0);
      expect(filter.q2).toBe(0.0);
      expect(filter.q3).toBe(0.0);
    });

    it('should reset quaternion to specified values', () => {
      const filter = new MadgwickFilter();
      filter.reset(0.5, 0.5, 0.5, 0.5);
      expect(filter.q0).toBe(0.5);
      expect(filter.q1).toBe(0.5);
    });

    it('should maintain normalized quaternion on update', () => {
      const filter = new MadgwickFilter(0.2);
      // Simulate static 1g pointing along Z-axis
      const q = filter.update(0, 0, 1.0, 0, 0, 0, 0.02);
      const norm = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
      expect(norm).toBeCloseTo(1.0, 4);
    });

    it('should integrate angular velocity when rotating', () => {
      const filter = new MadgwickFilter(0.0); // pure gyroscope integration
      // Rotate around X-axis at 1 rad/s for 0.1s
      const q = filter.update(0, 0, 1.0, 1.0, 0, 0, 0.1);
      expect(q.x).toBeGreaterThan(0);
    });
  });

  describe('quaternionToEulerDeg', () => {
    it('should return 0 degrees for identity quaternion', () => {
      const euler = quaternionToEulerDeg({ w: 1, x: 0, y: 0, z: 0 });
      expect(euler.roll).toBeCloseTo(0, 2);
      expect(euler.pitch).toBeCloseTo(0, 2);
      expect(euler.yaw).toBeCloseTo(0, 2);
    });

    it('should compute ~90 degree roll for 90 degree X rotation', () => {
      // 90 deg around X: w = cos(45) = sqrt(2)/2, x = sin(45) = sqrt(2)/2
      const val = Math.SQRT1_2;
      const euler = quaternionToEulerDeg({ w: val, x: val, y: 0, z: 0 });
      expect(euler.roll).toBeCloseTo(90, 1);
      expect(euler.pitch).toBeCloseTo(0, 1);
    });
  });

  describe('classifyGaitPhase', () => {
    it('should detect heel_strike when foot is dorsiflexed with impact', () => {
      const phase = classifyGaitPhase(12, 1.5, 0.4);
      expect(phase).toBe('heel_strike');
    });

    it('should detect toe_off when foot is plantarflexed with angular velocity', () => {
      const phase = classifyGaitPhase(-15, 1.0, 1.4);
      expect(phase).toBe('toe_off');
    });

    it('should detect flat_foot when level and calm', () => {
      const phase = classifyGaitPhase(1.5, 1.0, 0.3);
      expect(phase).toBe('flat_foot');
    });

    it('should detect swing when angular velocity is high without impact', () => {
      const phase = classifyGaitPhase(2.0, 0.9, 1.6);
      expect(phase).toBe('swing');
    });

    it('should return neutral for other conditions', () => {
      const phase = classifyGaitPhase(7.0, 0.9, 0.9);
      expect(phase).toBe('neutral');
    });
  });

  describe('computeOrientationTrajectory', () => {
    it('should return empty array for empty readings', () => {
      expect(computeOrientationTrajectory([])).toEqual([]);
    });

    it('should compute trajectory frames for a sequence of readings', () => {
      const mockReadings: ImuReading[] = [
        {
          timestamp_epoch_us: 1000000,
          timestamp_iso: '2026-10-07T00:00:01.000Z',
          ax: 0.1,
          ay: 0.1,
          az: 0.98,
          gx: 0.01,
          gy: 0.02,
          gz: 0.0,
        },
        {
          timestamp_epoch_us: 1020000,
          timestamp_iso: '2026-10-07T00:00:01.020Z',
          ax: 0.12,
          ay: 0.11,
          az: 0.97,
          gx: 0.05,
          gy: 0.02,
          gz: 0.01,
        },
      ];

      const trajectory = computeOrientationTrajectory(mockReadings);
      expect(trajectory.length).toBe(2);
      expect(trajectory[0].timeSec).toBe(0);
      expect(trajectory[1].timeSec).toBeCloseTo(0.02, 3);
      expect(trajectory[0].q.w).toBeDefined();
      expect(trajectory[0].euler.pitch).toBeDefined();
      expect(trajectory[0].gaitPhase).toBeDefined();
    });
  });
});
