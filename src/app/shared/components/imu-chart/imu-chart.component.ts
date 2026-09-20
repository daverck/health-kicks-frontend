import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
} from 'chart.js';
import { ImuReading } from '../../../models/telemetry.models';

// Register required Chart.js modules tree-shakably
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip
);

@Component({
  selector: 'app-imu-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imu-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImuChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() readings: ImuReading[] = [];

  @ViewChild('accelCanvas') private accelCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('gyroCanvas') private gyroCanvasRef?: ElementRef<HTMLCanvasElement>;

  private chartAccel: Chart | null = null;
  private chartGyro: Chart | null = null;

  // Axis visibility signals (Acceleration)
  readonly showAx = signal<boolean>(true);
  readonly showAy = signal<boolean>(true);
  readonly showAz = signal<boolean>(true);
  readonly showMag = signal<boolean>(false);

  // Axis visibility signals (Gyroscope)
  readonly showGx = signal<boolean>(true);
  readonly showGy = signal<boolean>(true);
  readonly showGz = signal<boolean>(true);

  toggleAccelAxis(axis: 'ax' | 'ay' | 'az' | 'mag'): void {
    let nextVal = true;
    let datasetIdx = 0;
    switch (axis) {
      case 'ax':
        this.showAx.update((v) => !v);
        nextVal = this.showAx();
        datasetIdx = 0;
        break;
      case 'ay':
        this.showAy.update((v) => !v);
        nextVal = this.showAy();
        datasetIdx = 1;
        break;
      case 'az':
        this.showAz.update((v) => !v);
        nextVal = this.showAz();
        datasetIdx = 2;
        break;
      case 'mag':
        this.showMag.update((v) => !v);
        nextVal = this.showMag();
        datasetIdx = 3;
        break;
    }
    if (this.chartAccel) {
      this.chartAccel.setDatasetVisibility(datasetIdx, nextVal);
      this.chartAccel.update();
    }
  }

  setAllAccel(visible: boolean): void {
    this.showAx.set(visible);
    this.showAy.set(visible);
    this.showAz.set(visible);
    this.showMag.set(visible);
    if (this.chartAccel) {
      for (let i = 0; i < 4; i++) {
        this.chartAccel.setDatasetVisibility(i, visible);
      }
      this.chartAccel.update();
    }
  }

  toggleGyroAxis(axis: 'gx' | 'gy' | 'gz'): void {
    let nextVal = true;
    let datasetIdx = 0;
    switch (axis) {
      case 'gx':
        this.showGx.update((v) => !v);
        nextVal = this.showGx();
        datasetIdx = 0;
        break;
      case 'gy':
        this.showGy.update((v) => !v);
        nextVal = this.showGy();
        datasetIdx = 1;
        break;
      case 'gz':
        this.showGz.update((v) => !v);
        nextVal = this.showGz();
        datasetIdx = 2;
        break;
    }
    if (this.chartGyro) {
      this.chartGyro.setDatasetVisibility(datasetIdx, nextVal);
      this.chartGyro.update();
    }
  }

  setAllGyro(visible: boolean): void {
    this.showGx.set(visible);
    this.showGy.set(visible);
    this.showGz.set(visible);
    if (this.chartGyro) {
      for (let i = 0; i < 3; i++) {
        this.chartGyro.setDatasetVisibility(i, visible);
      }
      this.chartGyro.update();
    }
  }

  ngAfterViewInit(): void {
    this.renderCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['readings']) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    if (this.chartAccel) {
      this.chartAccel.destroy();
      this.chartAccel = null;
    }
    if (this.chartGyro) {
      this.chartGyro.destroy();
      this.chartGyro = null;
    }
  }

  private renderCharts(): void {
    this.destroyCharts();

    if (!this.readings || this.readings.length === 0) {
      return;
    }

    if (!this.accelCanvasRef?.nativeElement || !this.gyroCanvasRef?.nativeElement) {
      return;
    }

    const t0 = this.readings[0].timestamp_epoch_us;

    // Prepare point coordinates { x: t_offset_sec, y: value }
    const dataAx: { x: number; y: number }[] = [];
    const dataAy: { x: number; y: number }[] = [];
    const dataAz: { x: number; y: number }[] = [];
    const dataMag: { x: number; y: number }[] = [];

    const dataGx: { x: number; y: number }[] = [];
    const dataGy: { x: number; y: number }[] = [];
    const dataGz: { x: number; y: number }[] = [];

    for (const r of this.readings) {
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

    // Common options for crisp, performant timeseries rendering
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      elements: {
        point: {
          radius: 0, // Clean lines without drawing hundreds of dots
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
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            font: { size: 12 },
          },
          onClick: (e: unknown, legendItem: { datasetIndex?: number }, legend: { chart: Chart }) => {
            const index = legendItem.datasetIndex;
            if (index === undefined) return;
            const chart = legend.chart;
            const isVisible = chart.isDatasetVisible(index);
            chart.setDatasetVisibility(index, !isVisible);
            chart.update();

            // Sync with signals
            if (chart === this.chartAccel) {
              if (index === 0) this.showAx.set(!isVisible);
              else if (index === 1) this.showAy.set(!isVisible);
              else if (index === 2) this.showAz.set(!isVisible);
              else if (index === 3) this.showMag.set(!isVisible);
            } else if (chart === this.chartGyro) {
              if (index === 0) this.showGx.set(!isVisible);
              else if (index === 1) this.showGy.set(!isVisible);
              else if (index === 2) this.showGz.set(!isVisible);
            }
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

    // 1. Acceleration Chart (g)
    const accelConfig: ChartConfiguration = {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'AX (g)',
            data: dataAx,
            borderColor: '#ef4444', // Red
            backgroundColor: '#ef4444',
            hidden: !this.showAx(),
          },
          {
            label: 'AY (g)',
            data: dataAy,
            borderColor: '#10b981', // Emerald
            backgroundColor: '#10b981',
            hidden: !this.showAy(),
          },
          {
            label: 'AZ (g)',
            data: dataAz,
            borderColor: '#3b82f6', // Blue
            backgroundColor: '#3b82f6',
            hidden: !this.showAz(),
          },
          {
            label: 'Magnitude (g)',
            data: dataMag,
            borderColor: '#8b5cf6', // Purple
            backgroundColor: '#8b5cf6',
            borderDash: [4, 4],
            hidden: !this.showMag(),
          },
        ],
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
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
    };

    // 2. Gyroscope Chart (rad/s)
    const gyroConfig: ChartConfiguration = {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'GX (rad/s)',
            data: dataGx,
            borderColor: '#f59e0b', // Amber
            backgroundColor: '#f59e0b',
            hidden: !this.showGx(),
          },
          {
            label: 'GY (rad/s)',
            data: dataGy,
            borderColor: '#06b6d4', // Cyan
            backgroundColor: '#06b6d4',
            hidden: !this.showGy(),
          },
          {
            label: 'GZ (rad/s)',
            data: dataGz,
            borderColor: '#ec4899', // Pink
            backgroundColor: '#ec4899',
            hidden: !this.showGz(),
          },
        ],
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
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
    };

    this.chartAccel = new Chart(this.accelCanvasRef.nativeElement, accelConfig);
    this.chartGyro = new Chart(this.gyroCanvasRef.nativeElement, gyroConfig);
  }
}

