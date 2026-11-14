import { Component, inject, input, OnDestroy, OnInit, output, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PrototypeItem } from '../home.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-home-prototypes',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './home-prototypes.component.html',
})
export class HomePrototypesComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private timerId: ReturnType<typeof setInterval> | null = null;
  readonly autoAdvanceIntervalMs = 4000;

  readonly prototypes = input.required<PrototypeItem[]>();
  readonly selectedPrototype = input.required<number>();

  readonly prototypeSelect = output<number>();

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

  onManualSelect(index: number): void {
    this.prototypeSelect.emit(index);
    this.resetTimer();
  }

  advancePrototype(): void {
    const list = this.prototypes();
    if (!list || list.length === 0) return;
    const current = this.selectedPrototype();
    const nextIndex = (current + 1) % list.length;
    this.prototypeSelect.emit(nextIndex);
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (!this.isPaused()) {
        this.advancePrototype();
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

