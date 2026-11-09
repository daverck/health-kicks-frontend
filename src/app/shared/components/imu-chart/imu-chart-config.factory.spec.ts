import { describe, it, expect, vi } from 'vitest';
import { Chart } from 'chart.js';
import {
  extractImuSeriesData,
  createPlaybackCursorPlugin,
  createAccelChartConfig,
  createGyroChartConfig,
  ImuCursorPluginState,
} from './imu-chart-config.factory';
import { ImuReading } from '../../../models/telemetry.models';

describe('ImuChartConfigFactory', () => {
  const mockReadings: ImuReading[] = [
    {
      timestamp_epoch_us: 1_000_000_000_000,
      ax: 1.0,
      ay: 2.0,
      az: 2.0, // mag = sqrt(1 + 4 + 4) = 3
      gx: 0.1,
      gy: -0.2,
      gz: 0.5,
    },
    {
      timestamp_epoch_us: 1_000_000_500_000, // 0.5s later
      ax: 0.0,
      ay: 0.0,
      az: 0.0,
      gx: 1.0,
      gy: 1.0,
      gz: 1.0,
    },
  ];

  describe('extractImuSeriesData', () => {
    it('should return empty arrays when given empty readings', () => {
      const result = extractImuSeriesData([]);
      expect(result.dataAx).toEqual([]);
      expect(result.dataAy).toEqual([]);
      expect(result.dataAz).toEqual([]);
      expect(result.dataMag).toEqual([]);
      expect(result.dataGx).toEqual([]);
      expect(result.dataGy).toEqual([]);
      expect(result.dataGz).toEqual([]);
    });

    it('should compute time offsets and magnitude accurately', () => {
      const result = extractImuSeriesData(mockReadings);

      expect(result.dataAx.length).toBe(2);
      expect(result.dataAx[0]).toEqual({ x: 0, y: 1.0 });
      expect(result.dataAx[1]).toEqual({ x: 0.5, y: 0.0 });

      // First point magnitude = sqrt(1^2 + 2^2 + 2^2) = 3.0
      expect(result.dataMag[0].y).toBeCloseTo(3.0);
      expect(result.dataMag[1].y).toBeCloseTo(0.0);

      // Gyro values
      expect(result.dataGx[0]).toEqual({ x: 0, y: 0.1 });
      expect(result.dataGy[0]).toEqual({ x: 0, y: -0.2 });
      expect(result.dataGz[0]).toEqual({ x: 0, y: 0.5 });
    });
  });

  describe('createPlaybackCursorPlugin', () => {
    it('should create plugin with id playbackCursor', () => {
      const state: ImuCursorPluginState = {
        trimSelectionEnabled: false,
        trimStartTimeSec: null,
        trimEndTimeSec: null,
        playbackTimeSec: null,
      };
      const plugin = createPlaybackCursorPlugin(() => state);
      expect(plugin.id).toBe('playbackCursor');
      expect(typeof plugin.afterDraw).toBe('function');
    });

    it('should safely exit afterDraw when scales are missing', () => {
      const plugin = createPlaybackCursorPlugin(() => ({
        trimSelectionEnabled: false,
        trimStartTimeSec: null,
        trimEndTimeSec: null,
        playbackTimeSec: null,
      }));

      const mockChart = {
        scales: {},
        ctx: {} as CanvasRenderingContext2D,
      } as unknown as Chart;

      expect(() => (plugin.afterDraw as any)(mockChart)).not.toThrow();
    });

    it('should draw shaded trim regions and markers when trim is enabled', () => {
      const state: ImuCursorPluginState = {
        trimSelectionEnabled: true,
        trimStartTimeSec: 1.0,
        trimEndTimeSec: 3.0,
        playbackTimeSec: 2.0,
      };
      const plugin = createPlaybackCursorPlugin(() => state);

      const fillRectSpy = vi.fn();
      const strokeSpy = vi.fn();
      const arcSpy = vi.fn();
      const fillTextSpy = vi.fn();

      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: strokeSpy,
        fill: vi.fn(),
        arc: arcSpy,
        fillRect: fillRectSpy,
        fillText: fillTextSpy,
        setLineDash: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      const mockChart = {
        scales: {
          x: {
            left: 0,
            right: 500,
            getPixelForValue: vi.fn((val: number) => val * 100),
          },
          y: {
            top: 0,
            bottom: 200,
          },
        },
        ctx: mockCtx,
      } as unknown as Chart;

      (plugin.afterDraw as any)(mockChart);

      // Shaded rectangles drawn for trim
      expect(fillRectSpy).toHaveBeenCalledTimes(2);
      // Trim labels D and F rendered
      expect(fillTextSpy).toHaveBeenCalledWith('D', 100, 8);
      expect(fillTextSpy).toHaveBeenCalledWith('F', 300, 8);
    });
  });

  describe('createAccelChartConfig', () => {
    it('should build configuration with 4 acceleration datasets and correct labels/colors', () => {
      const series = extractImuSeriesData(mockReadings);
      const cursorPlugin = createPlaybackCursorPlugin(() => ({
        trimSelectionEnabled: false,
        trimStartTimeSec: null,
        trimEndTimeSec: null,
        playbackTimeSec: null,
      }));

      const config = createAccelChartConfig(
        series,
        { showAx: true, showAy: false, showAz: true, showMag: false },
        cursorPlugin,
        {}
      );

      expect(config.type).toBe('line');
      expect(config.data.datasets.length).toBe(4);

      const [ax, ay, az, mag] = config.data.datasets;
      expect(ax.label).toBe('AX (g)');
      expect(ax.hidden).toBe(false);
      expect(ay.label).toBe('AY (g)');
      expect(ay.hidden).toBe(true);
      expect(az.label).toBe('AZ (g)');
      expect(az.hidden).toBe(false);
      expect(mag.label).toBe('Magnitude (g)');
      expect(mag.hidden).toBe(true);

      expect((config.options?.scales as any)?.y?.title?.text).toBe('Accélération (g)');
    });
  });

  describe('createGyroChartConfig', () => {
    it('should build configuration with 3 gyroscope datasets and correct labels/colors', () => {
      const series = extractImuSeriesData(mockReadings);
      const cursorPlugin = createPlaybackCursorPlugin(() => ({
        trimSelectionEnabled: false,
        trimStartTimeSec: null,
        trimEndTimeSec: null,
        playbackTimeSec: null,
      }));

      const config = createGyroChartConfig(
        series,
        { showGx: true, showGy: true, showGz: false },
        cursorPlugin,
        {}
      );

      expect(config.type).toBe('line');
      expect(config.data.datasets.length).toBe(3);

      const [gx, gy, gz] = config.data.datasets;
      expect(gx.label).toBe('GX (rad/s)');
      expect(gx.hidden).toBe(false);
      expect(gy.label).toBe('GY (rad/s)');
      expect(gy.hidden).toBe(false);
      expect(gz.label).toBe('GZ (rad/s)');
      expect(gz.hidden).toBe(true);

      expect((config.options?.scales as any)?.y?.title?.text).toBe('Vitesse angulaire (rad/s)');
    });
  });

  describe('commonOptions callbacks', () => {
    it('should trigger onTimeSelected when clicked if not suppressed', () => {
      const series = extractImuSeriesData(mockReadings);
      const cursorPlugin = createPlaybackCursorPlugin(() => ({
        trimSelectionEnabled: false,
        trimStartTimeSec: null,
        trimEndTimeSec: null,
        playbackTimeSec: null,
      }));
      const onTimeSelected = vi.fn();

      const config = createAccelChartConfig(
        series,
        { showAx: true, showAy: true, showAz: true, showMag: true },
        cursorPlugin,
        { onTimeSelected, shouldSuppressClick: () => false }
      );

      const mockChart = {
        scales: {
          x: {
            getValueForPixel: vi.fn((_pixel: number) => 1.25),
          },
        },
        canvas: {
          getBoundingClientRect: vi.fn(() => ({ left: 50 })),
        },
      } as unknown as Chart;

      const clickFn = config.options?.onClick as any;
      expect(typeof clickFn).toBe('function');

      clickFn({ native: { clientX: 100 } }, [], mockChart);
      expect(onTimeSelected).toHaveBeenCalledWith(1.25);
    });

    it('should not trigger onTimeSelected when suppressed', () => {
      const series = extractImuSeriesData(mockReadings);
      const cursorPlugin = createPlaybackCursorPlugin(() => ({
        trimSelectionEnabled: false,
        trimStartTimeSec: null,
        trimEndTimeSec: null,
        playbackTimeSec: null,
      }));
      const onTimeSelected = vi.fn();

      const config = createAccelChartConfig(
        series,
        { showAx: true, showAy: true, showAz: true, showMag: true },
        cursorPlugin,
        { onTimeSelected, shouldSuppressClick: () => true }
      );

      const clickFn = config.options?.onClick as any;
      clickFn({ native: { clientX: 100 } }, [], {} as Chart);
      expect(onTimeSelected).not.toHaveBeenCalled();
    });

    it('should trigger onLegendClick when legend item is clicked', () => {
      const series = extractImuSeriesData(mockReadings);
      const cursorPlugin = createPlaybackCursorPlugin(() => ({
        trimSelectionEnabled: false,
        trimStartTimeSec: null,
        trimEndTimeSec: null,
        playbackTimeSec: null,
      }));
      const onLegendClick = vi.fn();

      const config = createAccelChartConfig(
        series,
        { showAx: true, showAy: true, showAz: true, showMag: true },
        cursorPlugin,
        { onLegendClick }
      );

      const isDatasetVisibleSpy = vi.fn(() => true);
      const setDatasetVisibilitySpy = vi.fn();
      const updateSpy = vi.fn();

      const mockChart = {
        isDatasetVisible: isDatasetVisibleSpy,
        setDatasetVisibility: setDatasetVisibilitySpy,
        update: updateSpy,
      } as unknown as Chart;

      const legendOnClick = (config.options?.plugins?.legend as any)?.onClick;
      expect(typeof legendOnClick).toBe('function');

      legendOnClick({}, { datasetIndex: 1 }, { chart: mockChart });

      expect(setDatasetVisibilitySpy).toHaveBeenCalledWith(1, false);
      expect(updateSpy).toHaveBeenCalled();
      expect(onLegendClick).toHaveBeenCalledWith(mockChart, 1, false);
    });
  });
});
