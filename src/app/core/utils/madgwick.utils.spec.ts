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
      expect(trajectory[0].position).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should integrate 3D position from tri-axial accelerations without backward reversal on a symmetric walking step', () => {
      // Simulate a walking step: rest -> 5 frames of +0.8g forward accel -> 5 frames of -0.8g braking decel -> 3 frames of rest
      const stepReadings: ImuReading[] = [];
      let tUs = 1000000;
      const pushFrame = (ax: number, ay: number, az: number) => {
        stepReadings.push({
          timestamp_epoch_us: tUs,
          timestamp_iso: '2026-10-07T00:00:01.000Z',
          ax,
          ay,
          az,
          gx: 0,
          gy: 0,
          gz: 0,
        });
        tUs += 20000; // 20ms (50Hz)
      };

      pushFrame(0, 0, 1.0); // Initial stationary reference
      for (let i = 0; i < 5; i++) pushFrame(0.8, 0, 1.0); // Forward push-off
      for (let i = 0; i < 5; i++) pushFrame(-0.8, 0, 1.0); // Equal braking deceleration
      for (let i = 0; i < 3; i++) pushFrame(0, 0, 1.0); // Stance phase

      const trajectory = computeOrientationTrajectory(stepReadings);
      // Forward position z must never move backward during or after braking
      for (let i = 1; i < trajectory.length; i++) {
        expect(trajectory[i].position.z).toBeGreaterThanOrEqual(
          trajectory[i - 1].position.z - 1e-6
        );
      }
      expect(trajectory[trajectory.length - 1].position.z).toBeGreaterThan(0.1);
    });

    it('should preserve vertical height (Y) during stair climbing and allow negative Y for descent without clamping', () => {
      const stairReadings: ImuReading[] = [];
      let tUs = 1000000;
      const pushFrame = (ax: number, ay: number, az: number) => {
        stairReadings.push({
          timestamp_epoch_us: tUs,
          timestamp_iso: '2026-10-07T00:00:01.000Z',
          ax,
          ay,
          az,
          gx: 0,
          gy: 0,
          gz: 0,
        });
        tUs += 20000;
      };

      pushFrame(0, 0, 1.0);
      // Upward acceleration then equal downward deceleration to land on a higher step
      for (let i = 0; i < 4; i++) pushFrame(0.5, 0, 1.8);
      for (let i = 0; i < 4; i++) pushFrame(-0.5, 0, 0.2);
      // Stationary on the stair step: height Y must be preserved and not pulled back toward 0
      const stepLandIndex = stairReadings.length - 1;
      for (let i = 0; i < 5; i++) pushFrame(0, 0, 1.0);

      const trajectory = computeOrientationTrajectory(stairReadings);
      const heightAtLanding = trajectory[stepLandIndex].position.y;
      const heightAfterStance = trajectory[trajectory.length - 1].position.y;

      expect(heightAtLanding).toBeGreaterThan(0.05);
      expect(heightAfterStance).toBeCloseTo(heightAtLanding, 4);
    });

    it('should cancel residual downward velocity via ZUPT + linear de-drifting after a jump with undersampled landing shock and allow Y < 0 on stair descent', () => {
      const jumpReadings: ImuReading[] = [];
      let tUs = 1000000;
      const pushFrame = (ax: number, ay: number, az: number) => {
        jumpReadings.push({
          timestamp_epoch_us: tUs,
          timestamp_iso: '2026-10-07T00:00:01.000Z',
          ax,
          ay,
          az,
          gx: 0,
          gy: 0,
          gz: 0,
        });
        tUs += 52631; // ~19Hz (52.6ms)
      };

      pushFrame(0, 0, 1.0); // Initial stance
      // Take-off push (+1.2g linear vertical)
      for (let i = 0; i < 3; i++) pushFrame(0, 0, 2.2);
      // Free-fall flight (-1.0g linear vertical for 6 frames -> raw velocity becomes strongly negative)
      for (let i = 0; i < 6; i++) pushFrame(0, 0, 0.0);
      // Undersampled landing shock at 19Hz (+1.4g for 1 frame -> raw velocity would remain negative without ZUPT de-drifting)
      pushFrame(0, 0, 2.4);
      const landingStanceIdx = jumpReadings.length;
      // Stationary on floor after landing (ZUPT active)
      for (let i = 0; i < 5; i++) pushFrame(0, 0, 1.0);

      const jumpTrajectory = computeOrientationTrajectory(jumpReadings);
      const yAtLandingStance = jumpTrajectory[landingStanceIdx].position.y;
      const yAtEnd = jumpTrajectory[jumpTrajectory.length - 1].position.y;

      // After landing stance is reached, velocity must be zeroed (no continued downward inertia)
      expect(yAtEnd).toBeCloseTo(yAtLandingStance, 5);
      expect(yAtLandingStance).toBeGreaterThan(-0.05);

      // Verify stair descent (Y < 0) remains unrestricted
      const descentReadings: ImuReading[] = [];
      tUs = 1000000;
      const pushDescent = (az: number) => {
        descentReadings.push({
          timestamp_epoch_us: tUs,
          timestamp_iso: '2026-10-07T00:00:01.000Z',
          ax: 0.3,
          ay: 0,
          az,
          gx: 0,
          gy: 0,
          gz: 0,
        });
        tUs += 20000;
      };
      pushDescent(1.0);
      for (let i = 0; i < 4; i++) pushDescent(0.2); // Downward acceleration (-0.8g)
      for (let i = 0; i < 4; i++) pushDescent(1.8); // Braking on lower step (+0.8g)
      for (let i = 0; i < 3; i++) {
        descentReadings.push({
          timestamp_epoch_us: tUs,
          timestamp_iso: '2026-10-07T00:00:01.000Z',
          ax: 0,
          ay: 0,
          az: 1.0,
          gx: 0,
          gy: 0,
          gz: 0,
        });
        tUs += 20000;
      }

      const descentTrajectory = computeOrientationTrajectory(descentReadings);
      expect(descentTrajectory[descentTrajectory.length - 1].position.y).toBeLessThan(-0.05);
    });
  });
});
