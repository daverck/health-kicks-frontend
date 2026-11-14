import { Component, inject, input, OnDestroy, OnInit, output, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { HeroVisualMode, SimulationMode, AppTab } from '../home.component';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './home-hero.component.html',
})
export class HomeHeroComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private timerId: ReturnType<typeof setInterval> | null = null;
  readonly autoAdvanceIntervalMs = 4000;

  readonly isAuthenticated = input.required<boolean>();
  readonly showWordplay = input.required<boolean>();
  readonly heroVisualMode = input.required<HeroVisualMode>();
  readonly activeSimulation = input.required<SimulationMode>();

  readonly heroVisualChange = output<HeroVisualMode>();
  readonly simulationChange = output<SimulationMode>();
  readonly exploreTab = output<AppTab>();

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

  onManualHeroVisualSelect(mode: HeroVisualMode): void {
    this.heroVisualChange.emit(mode);
    if (mode === 'shoe') {
      this.simulationChange.emit('walk');
    }
    this.resetTimer();
  }

  onManualSimulationSelect(mode: SimulationMode): void {
    this.simulationChange.emit(mode);
    this.resetTimer();
  }

  advanceHero(): void {
    const visualMode = this.heroVisualMode();

    if (visualMode === 'shoe') {
      const sim = this.activeSimulation();
      if (sim === 'walk') {
        this.simulationChange.emit('fall');
      } else if (sim === 'fall') {
        this.simulationChange.emit('idle');
      } else {
        // Full rotation option A: after completing idle, advance to web visual
        this.heroVisualChange.emit('web');
      }
    } else if (visualMode === 'web') {
      this.heroVisualChange.emit('mobile');
    } else if (visualMode === 'mobile') {
      this.heroVisualChange.emit('shoe');
      this.simulationChange.emit('walk');
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (!this.isPaused()) {
        this.advanceHero();
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

