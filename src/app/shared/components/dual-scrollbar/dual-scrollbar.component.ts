import {
  Component,
  ElementRef,
  viewChild,
  signal,
  input,
  AfterViewInit,
  OnDestroy,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dual-scrollbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dual-scrollbar.component.html',
  styleUrls: ['./dual-scrollbar.component.css'],
})
export class DualScrollbarComponent implements AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);

  readonly ariaLabel = input<string>('Scrollable data table');

  readonly topScroll = viewChild<ElementRef<HTMLDivElement>>('topScroll');
  readonly bottomScroll = viewChild<ElementRef<HTMLDivElement>>('bottomScroll');

  readonly contentWidth = signal<number>(0);
  readonly hasOverflow = signal<boolean>(false);

  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private isSyncing = false;

  ngAfterViewInit(): void {
    const topEl = this.topScroll()?.nativeElement;
    const bottomEl = this.bottomScroll()?.nativeElement;

    if (!topEl || !bottomEl) return;

    // Run high-frequency scroll listeners outside Angular zone to avoid triggering change detection on each pixel scroll
    this.ngZone.runOutsideAngular(() => {
      topEl.addEventListener('scroll', this.onTopScroll, { passive: true });
      bottomEl.addEventListener('scroll', this.onBottomScroll, { passive: true });
    });

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateMetrics();
      });
      this.resizeObserver.observe(bottomEl);

      const firstChild = bottomEl.firstElementChild;
      if (firstChild) {
        this.resizeObserver.observe(firstChild);
      }
    }

    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => {
        this.updateMetrics();
        const child = bottomEl.firstElementChild;
        if (child && this.resizeObserver) {
          this.resizeObserver.observe(child);
        }
      });
      this.mutationObserver.observe(bottomEl, { childList: true, subtree: true });
    }

    this.updateMetrics();
  }

  private onTopScroll = (): void => {
    if (this.isSyncing) return;
    const topEl = this.topScroll()?.nativeElement;
    const bottomEl = this.bottomScroll()?.nativeElement;
    if (!topEl || !bottomEl) return;

    if (Math.abs(bottomEl.scrollLeft - topEl.scrollLeft) >= 1) {
      this.isSyncing = true;
      bottomEl.scrollLeft = topEl.scrollLeft;
      requestAnimationFrame(() => {
        this.isSyncing = false;
      });
    }
  };

  private onBottomScroll = (): void => {
    if (this.isSyncing) return;
    const topEl = this.topScroll()?.nativeElement;
    const bottomEl = this.bottomScroll()?.nativeElement;
    if (!topEl || !bottomEl) return;

    if (Math.abs(topEl.scrollLeft - bottomEl.scrollLeft) >= 1) {
      this.isSyncing = true;
      topEl.scrollLeft = bottomEl.scrollLeft;
      requestAnimationFrame(() => {
        this.isSyncing = false;
      });
    }
  };

  updateMetrics(): void {
    const bottomEl = this.bottomScroll()?.nativeElement;
    if (!bottomEl) return;

    const scrollWidth = bottomEl.scrollWidth;
    const clientWidth = bottomEl.clientWidth;
    const overflow = scrollWidth > clientWidth + 2;

    if (this.contentWidth() !== scrollWidth) {
      this.contentWidth.set(scrollWidth);
    }
    if (this.hasOverflow() !== overflow) {
      this.hasOverflow.set(overflow);
    }
  }

  ngOnDestroy(): void {
    const topEl = this.topScroll()?.nativeElement;
    const bottomEl = this.bottomScroll()?.nativeElement;

    if (topEl) {
      topEl.removeEventListener('scroll', this.onTopScroll);
    }
    if (bottomEl) {
      bottomEl.removeEventListener('scroll', this.onBottomScroll);
    }

    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }
}
