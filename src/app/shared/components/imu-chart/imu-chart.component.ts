import {
  Component,
  ElementRef,
  Input,
  output,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';
import { ImuReading } from '../../../models/telemetry.models';
import { TranslatePipe } from '../../pipes/translate.pipe';
import {
  extractImuSeriesData,
  createPlaybackCursorPlugin,
  createAccelChartConfig,
  createGyroChartConfig,
} from './imu-chart-config.factory';

@Component({
  selector: 'app-imu-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './imu-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImuChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() readings: ImuReading[] = [];
  @Input() playbackTimeSec: number | null = null;
  @Input() trimStartTimeSec: number | null = null;
  @Input() trimEndTimeSec: number | null = null;
  @Input() trimSelectionEnabled = false;
  @Input() showIsbGuideSection = true;
  readonly timeSelected = output<number>();
  readonly trimHandleChanged = output<{ handle: 'start' | 'end'; timeSec: number }>();

  @ViewChild('accelCanvas') private accelCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('gyroCanvas') private gyroCanvasRef?: ElementRef<HTMLCanvasElement>;

  private chartAccel: Chart | null = null;
  private chartGyro: Chart | null = null;
  private activeTrimHandle: 'start' | 'end' | null = null;
  private trimPointerStart: { pointerId: number; x: number; y: number } | null = null;
  private suppressNextClick = false;
  private trimInteractionCleanups: (() => void)[] = [];

  // Biomechanical ISB Guide visibility
  readonly showIsbGuide = signal<boolean>(false);

  // Axis visibility signals (Acceleration)
  readonly showAx = signal<boolean>(true);
  readonly showAy = signal<boolean>(true);
  readonly showAz = signal<boolean>(true);
  readonly showMag = signal<boolean>(false);

  // Axis visibility signals (Gyroscope)
  readonly showGx = signal<boolean>(true);
  readonly showGy = signal<boolean>(true);
  readonly showGz = signal<boolean>(true);

  toggleIsbGuide(): void {
    this.showIsbGuide.update((v) => !v);
  }

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
    } else if (
      changes['playbackTimeSec'] ||
      changes['trimStartTimeSec'] ||
      changes['trimEndTimeSec']
    ) {
      this.updateCursor();
    }
  }

  private updateCursor(): void {
    const touchAction = this.trimSelectionEnabled ? 'none' : '';
    if (this.accelCanvasRef) this.accelCanvasRef.nativeElement.style.touchAction = touchAction;
    if (this.gyroCanvasRef) this.gyroCanvasRef.nativeElement.style.touchAction = touchAction;
    if (this.chartAccel) {
      this.chartAccel.update('none');
    }
    if (this.chartGyro) {
      this.chartGyro.update('none');
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    this.clearTrimInteractions();
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

    const series = extractImuSeriesData(this.readings);

    const cursorPlugin = createPlaybackCursorPlugin(() => ({
      trimSelectionEnabled: this.trimSelectionEnabled,
      trimStartTimeSec: this.trimStartTimeSec,
      trimEndTimeSec: this.trimEndTimeSec,
      playbackTimeSec: this.playbackTimeSec,
    }));

    const callbacks = {
      shouldSuppressClick: () => {
        if (this.suppressNextClick) {
          this.suppressNextClick = false;
          return true;
        }
        return false;
      },
      onTimeSelected: (timeSec: number) => {
        this.timeSelected.emit(timeSec);
      },
      onLegendClick: (chart: Chart, index: number, isVisible: boolean) => {
        if (chart === this.chartAccel) {
          if (index === 0) this.showAx.set(isVisible);
          else if (index === 1) this.showAy.set(isVisible);
          else if (index === 2) this.showAz.set(isVisible);
          else if (index === 3) this.showMag.set(isVisible);
        } else if (chart === this.chartGyro) {
          if (index === 0) this.showGx.set(isVisible);
          else if (index === 1) this.showGy.set(isVisible);
          else if (index === 2) this.showGz.set(isVisible);
        }
      },
    };

    const accelConfig = createAccelChartConfig(
      series,
      {
        showAx: this.showAx(),
        showAy: this.showAy(),
        showAz: this.showAz(),
        showMag: this.showMag(),
      },
      cursorPlugin,
      callbacks
    );

    const gyroConfig = createGyroChartConfig(
      series,
      {
        showGx: this.showGx(),
        showGy: this.showGy(),
        showGz: this.showGz(),
      },
      cursorPlugin,
      callbacks
    );

    this.chartAccel = new Chart(this.accelCanvasRef.nativeElement, accelConfig);
    this.chartGyro = new Chart(this.gyroCanvasRef.nativeElement, gyroConfig);
    this.attachTrimInteractions(this.accelCanvasRef.nativeElement, this.chartAccel);
    this.attachTrimInteractions(this.gyroCanvasRef.nativeElement, this.chartGyro);
  }

  private attachTrimInteractions(canvas: HTMLCanvasElement, chart: Chart): void {
    canvas.style.touchAction = this.trimSelectionEnabled ? 'none' : '';
    const tooltipEnabledBeforeTrimDrag = chart.options.plugins?.tooltip?.enabled;

    const getTrimHandleAt = (event: PointerEvent): 'start' | 'end' | null => {
      if (
        !this.trimSelectionEnabled ||
        this.trimStartTimeSec === null ||
        this.trimEndTimeSec === null
      ) {
        return null;
      }

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return null;
      const xPixel = ((event.clientX - rect.left) / rect.width) * chart.width;
      const xScale = chart.scales['x'];
      // Allow pointer events to extend beyond chart plot area boundaries by up to 24px (for marker headers and ends)
      const hitMargin = 24;
      if (!xScale || xPixel < xScale.left - hitMargin || xPixel > xScale.right + hitMargin) return null;

      const startDistance = Math.abs(xPixel - xScale.getPixelForValue(this.trimStartTimeSec));
      const endDistance = Math.abs(xPixel - xScale.getPixelForValue(this.trimEndTimeSec));
      const nearest = startDistance <= endDistance ? 'start' : 'end';
      return Math.min(startDistance, endDistance) <= 20 ? nearest : null;
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (this.trimSelectionEnabled) {
        this.trimPointerStart = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        };
      }
      this.activeTrimHandle = getTrimHandleAt(event);
      if (!this.activeTrimHandle) return;
      event.preventDefault();
      this.suppressNextClick = true;
      if (chart.options.plugins?.tooltip) {
        chart.options.plugins.tooltip.enabled = false;
      }
      chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
      chart.update('none');
      if (typeof canvas.setPointerCapture === 'function') {
        canvas.setPointerCapture(event.pointerId);
      }
      canvas.style.cursor = 'grabbing';
    };
    const onPointerMove = (event: PointerEvent): void => {
      if (
        this.trimPointerStart?.pointerId === event.pointerId &&
        Math.hypot(
          event.clientX - this.trimPointerStart.x,
          event.clientY - this.trimPointerStart.y
        ) > 4
      ) {
        this.suppressNextClick = true;
      }
      if (!this.activeTrimHandle) {
        canvas.style.cursor = getTrimHandleAt(event) ? 'grab' : '';
        return;
      }

      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const xPixel = ((event.clientX - rect.left) / rect.width) * chart.width;
      const xScale = chart.scales['x'];
      if (!xScale) return;
      const timeSec = xScale.getValueForPixel(
        Math.min(xScale.right, Math.max(xScale.left, xPixel))
      );
      if (timeSec !== undefined && timeSec !== null) {
        this.suppressNextClick = true;
        this.trimHandleChanged.emit({ handle: this.activeTrimHandle, timeSec });
      }
    };
    const onPointerUp = (event: PointerEvent): void => {
      if (this.trimPointerStart?.pointerId === event.pointerId) {
        this.trimPointerStart = null;
      }
      if (this.activeTrimHandle) {
        this.activeTrimHandle = null;
        if (chart.options.plugins?.tooltip) {
          chart.options.plugins.tooltip.enabled = tooltipEnabledBeforeTrimDrag;
        }
        chart.update('none');
        canvas.style.cursor = '';
      }
    };
    const onPointerCancel = (event: PointerEvent): void => {
      onPointerUp(event);
      this.suppressNextClick = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    this.trimInteractionCleanups.push(() => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.style.touchAction = '';
      canvas.style.cursor = '';
    });
  }

  private clearTrimInteractions(): void {
    for (const cleanup of this.trimInteractionCleanups) cleanup();
    this.trimInteractionCleanups = [];
    this.activeTrimHandle = null;
  }
}
