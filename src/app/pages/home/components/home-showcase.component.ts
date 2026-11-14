import { Component, inject, input, OnDestroy, OnInit, output, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppTab, ScreenshotItem } from '../home.component';
import { HomeScreenshotCardComponent } from './home-screenshot-card.component';

@Component({
  selector: 'app-home-showcase',
  standalone: true,
  imports: [CommonModule, TranslatePipe, HomeScreenshotCardComponent],
  templateUrl: './home-showcase.component.html',
})
export class HomeShowcaseComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private timerId: ReturnType<typeof setInterval> | null = null;
  readonly autoAdvanceIntervalMs = 4000;

  readonly activeAppTab = input.required<AppTab>();
  readonly selectedWebScreenshot = input.required<number>();
  readonly selectedMobileScreenshot = input.required<number>();
  readonly selectedEmergencyScreenshot = input.required<number>();
  readonly webScreenshots = input.required<ScreenshotItem[]>();
  readonly mobileScreenshots = input.required<ScreenshotItem[]>();
  readonly emergencyScreenshots = input.required<ScreenshotItem[]>();

  readonly tabChange = output<AppTab>();
  readonly selectWeb = output<number>();
  readonly selectMobile = output<number>();
  readonly selectEmergency = output<number>();

  readonly isPaused = signal(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startTimer();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  pauseAutoPlay(): void {
    this.isPaused.set(true);
  }

  resumeAutoPlay(): void {
    this.isPaused.set(false);
  }

  onManualTabSelect(tab: AppTab): void {
    this.tabChange.emit(tab);
    if (tab === 'web') {
      this.selectWeb.emit(0);
    } else if (tab === 'mobile') {
      this.selectMobile.emit(0);
    } else if (tab === 'emergency') {
      this.selectEmergency.emit(0);
    }
    this.resetTimer();
  }

  onManualScreenshotSelect(tab: AppTab, index: number): void {
    if (tab === 'web') {
      this.selectWeb.emit(index);
    } else if (tab === 'mobile') {
      this.selectMobile.emit(index);
    } else if (tab === 'emergency') {
      this.selectEmergency.emit(index);
    }
    this.resetTimer();
  }

  advanceShowcase(): void {
    const tab = this.activeAppTab();

    if (tab === 'web') {
      const total = this.webScreenshots().length;
      const current = this.selectedWebScreenshot();
      if (current + 1 < total) {
        this.selectWeb.emit(current + 1);
      } else {
        this.tabChange.emit('mobile');
        this.selectMobile.emit(0);
      }
    } else if (tab === 'mobile') {
      const total = this.mobileScreenshots().length;
      const current = this.selectedMobileScreenshot();
      if (current + 1 < total) {
        this.selectMobile.emit(current + 1);
      } else {
        this.tabChange.emit('emergency');
        this.selectEmergency.emit(0);
      }
    } else if (tab === 'emergency') {
      const total = this.emergencyScreenshots().length;
      const current = this.selectedEmergencyScreenshot();
      if (current + 1 < total) {
        this.selectEmergency.emit(current + 1);
      } else {
        this.tabChange.emit('web');
        this.selectWeb.emit(0);
      }
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (!this.isPaused()) {
        this.advanceShowcase();
      }
    }, this.autoAdvanceIntervalMs);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private resetTimer(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startTimer();
    }
  }
}

