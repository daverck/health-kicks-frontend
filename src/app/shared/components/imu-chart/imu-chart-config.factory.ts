import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
  ChartConfiguration,
  Plugin,
} from 'chart.js';
import { ImuReading } from '../../../models/telemetry.models';

/**
 * Register tree-shakable Chart.js modules.
 */
export function registerChartModules(): void {
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Legend,
    Tooltip
  );
}

// Ensure registration on module load
registerChartModules();

export interface ImuSeriesPoint {
  x: number;
  y: number;
}

export interface ImuSeriesData {
  dataAx: ImuSeriesPoint[];
  dataAy: ImuSeriesPoint[];
  dataAz: ImuSeriesPoint[];
  dataMag: ImuSeriesPoint[];
  dataGx: ImuSeriesPoint[];
  dataGy: ImuSeriesPoint[];
  dataGz: ImuSeriesPoint[];
}

export interface ImuCursorPluginState {
  trimSelectionEnabled: boolean;
  trimStartTimeSec: number | null;
  trimEndTimeSec: number | null;
  playbackTimeSec: number | null;
}

export interface ImuAccelVisibility {
  showAx: boolean;
  showAy: boolean;
  showAz: boolean;
  showMag: boolean;
}

export interface ImuGyroVisibility {
  showGx: boolean;
  showGy: boolean;
  showGz: boolean;
}

export interface ImuChartCallbacks {
  onTimeSelected?: (timeSec: number) => void;
  onLegendClick?: (chart: Chart, index: number, isVisible: boolean) => void;
  shouldSuppressClick?: () => boolean;
}

/**
 * Extracts and calculates coordinate points ({x: offset_sec, y: val}) from IMU readings.
 */
export function extractImuSeriesData(readings: ImuReading[]): ImuSeriesData {
  const dataAx: ImuSeriesPoint[] = [];
  const dataAy: ImuSeriesPoint[] = [];
  const dataAz: ImuSeriesPoint[] = [];
  const dataMag: ImuSeriesPoint[] = [];

  const dataGx: ImuSeriesPoint[] = [];
  const dataGy: ImuSeriesPoint[] = [];
  const dataGz: ImuSeriesPoint[] = [];

  if (!readings || readings.length === 0) {
    return { dataAx, dataAy, dataAz, dataMag, dataGx, dataGy, dataGz };
  }

  const t0 = readings[0].timestamp_epoch_us;

  for (const r of readings) {
    const tOffset = (r.timestamp_epoch_us - t0) / 1_000_000;
    const mag = Math.sqrt(r.ax * r.ax + r.ay * r.ay + r.az * r.az);

    dataAx.push({ x: tOffset, y: r.ax });
    dataAy.push({ x: tOffset, y: r.ay });
    dataAz.push({ x: tOffset, y: r.az });
    dataMag.push({ x: tOffset, y: mag });

    dataGx.push({ x: tOffset, y: r.gx });
    dataGy.push({ x: tOffset, y: r.gy });
    dataGz.push({ x: tOffset, y: r.gz });
  }

  return { dataAx, dataAy, dataAz, dataMag, dataGx, dataGy, dataGz };
}

/**
 * Creates the Chart.js plugin to render playback cursor and trim boundary markers.
 */
export function createPlaybackCursorPlugin(
  getState: () => ImuCursorPluginState
): Plugin<'line'> {
  return {
    id: 'playbackCursor',
    afterDraw: (chart: Chart) => {
      const xScale = chart.scales['x'];
      const yScale = chart.scales['y'];
      if (!xScale || !yScale) return;

      const state = getState();
      const ctx = chart.ctx;
      if (
        state.trimSelectionEnabled &&
        state.trimStartTimeSec !== null &&
        state.trimEndTimeSec !== null
      ) {
        const startPixel = xScale.getPixelForValue(state.trimStartTimeSec);
        const endPixel = xScale.getPixelForValue(state.trimEndTimeSec);
        ctx.save();
        ctx.fillStyle = 'rgba(107, 114, 128, 0.12)';
        ctx.fillRect(xScale.left, yScale.top, startPixel - xScale.left, yScale.bottom - yScale.top);
        ctx.fillRect(endPixel, yScale.top, xScale.right - endPixel, yScale.bottom - yScale.top);
        ctx.restore();
      }

      const drawMarker = (
        timeSec: number | null,
        color: string,
        lineWidth: number,
        lineDash: number[],
        label?: string
      ) => {
        if (timeSec === null) return;
        const xPixel = xScale.getPixelForValue(timeSec);
        if (xPixel < xScale.left || xPixel > xScale.right) return;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xPixel, yScale.top);
        ctx.lineTo(xPixel, yScale.bottom);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.setLineDash(lineDash);
        ctx.stroke();
        if (state.trimSelectionEnabled && label) {
          ctx.beginPath();
          ctx.arc(xPixel, yScale.top + 8, 7, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = color;
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, xPixel, yScale.top + 8);
        }
        if (!state.trimSelectionEnabled || !label) {
          ctx.beginPath();
          ctx.arc(xPixel, yScale.top + 3, 4.5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }
        ctx.restore();
      };

      drawMarker(state.trimStartTimeSec, '#059669', 2.5, [], 'D');
      drawMarker(state.trimEndTimeSec, '#e11d48', 2.5, [], 'F');
      drawMarker(state.playbackTimeSec, '#0284c7', 1.5, [4, 4]);
    },
  };
}

/**
 * Creates common Chart.js options shared across Accelerometer and Gyroscope charts.
 */
function createCommonOptions(callbacks: ImuChartCallbacks) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    elements: {
      point: {
        radius: 0,
        hitRadius: 6,
      },
      line: {
        borderWidth: 1.8,
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    onClick: (event: any, _elements: any, chart: Chart) => {
      if (callbacks.shouldSuppressClick && callbacks.shouldSuppressClick()) {
        return;
      }
      const xScale = chart.scales['x'];
      if (!xScale) return;
      const canvasRect = chart.canvas.getBoundingClientRect();
      const clientX = event.native ? event.native.clientX : event.x;
      const xPos = clientX - canvasRect.left;
      const xVal = xScale.getValueForPixel(xPos);
      if (xVal !== undefined && xVal !== null) {
        callbacks.onTimeSelected?.(Math.max(0, xVal));
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          font: { size: 12 },
        },
        onClick: (_e: unknown, legendItem: { datasetIndex?: number }, legend: { chart: Chart }) => {
          const index = legendItem.datasetIndex;
          if (index === undefined) return;
          const chart = legend.chart;
          const isVisible = chart.isDatasetVisible(index);
          chart.setDatasetVisibility(index, !isVisible);
          chart.update();

          callbacks.onLegendClick?.(chart, index, !isVisible);
        },
      },
      tooltip: {
        callbacks: {
          title: (items: { parsed: { x?: number | null } }[]) => {
            const xVal = items[0]?.parsed?.x;
            return xVal !== undefined && xVal !== null ? `t = ${xVal.toFixed(3)} s` : '';
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Temps écoulé (s)',
          font: { size: 11 },
        },
        ticks: {
          callback: (val: string | number) => `${Number(val).toFixed(1)}s`,
        },
      },
    },
  };
}

/**
 * Builds Chart.js configuration for the Tri-axial Accelerometer.
 */
export function createAccelChartConfig(
  series: Pick<ImuSeriesData, 'dataAx' | 'dataAy' | 'dataAz' | 'dataMag'>,
  visibility: ImuAccelVisibility,
  cursorPlugin: Plugin<'line'>,
  callbacks: ImuChartCallbacks
): ChartConfiguration<'line'> {
  const common = createCommonOptions(callbacks);
  return {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'AX (g)',
          data: series.dataAx,
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          hidden: !visibility.showAx,
        },
        {
          label: 'AY (g)',
          data: series.dataAy,
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          hidden: !visibility.showAy,
        },
        {
          label: 'AZ (g)',
          data: series.dataAz,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          hidden: !visibility.showAz,
        },
        {
          label: 'Magnitude (g)',
          data: series.dataMag,
          borderColor: '#8b5cf6',
          backgroundColor: '#8b5cf6',
          borderDash: [4, 4],
          hidden: !visibility.showMag,
        },
      ],
    },
    options: {
      ...common,
      scales: {
        ...common.scales,
        y: {
          type: 'linear',
          title: {
            display: true,
            text: 'Accélération (g)',
            font: { size: 11 },
          },
        },
      },
    },
    plugins: [cursorPlugin],
  };
}

/**
 * Builds Chart.js configuration for the Tri-axial Gyroscope.
 */
export function createGyroChartConfig(
  series: Pick<ImuSeriesData, 'dataGx' | 'dataGy' | 'dataGz'>,
  visibility: ImuGyroVisibility,
  cursorPlugin: Plugin<'line'>,
  callbacks: ImuChartCallbacks
): ChartConfiguration<'line'> {
  const common = createCommonOptions(callbacks);
  return {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'GX (rad/s)',
          data: series.dataGx,
          borderColor: '#f59e0b',
          backgroundColor: '#f59e0b',
          hidden: !visibility.showGx,
        },
        {
          label: 'GY (rad/s)',
          data: series.dataGy,
          borderColor: '#06b6d4',
          backgroundColor: '#06b6d4',
          hidden: !visibility.showGy,
        },
        {
          label: 'GZ (rad/s)',
          data: series.dataGz,
          borderColor: '#ec4899',
          backgroundColor: '#ec4899',
          hidden: !visibility.showGz,
        },
      ],
    },
    options: {
      ...common,
      scales: {
        ...common.scales,
        y: {
          type: 'linear',
          title: {
            display: true,
            text: 'Vitesse angulaire (rad/s)',
            font: { size: 11 },
          },
        },
      },
    },
    plugins: [cursorPlugin],
  };
}
