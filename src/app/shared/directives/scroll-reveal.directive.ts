import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Supported entrance directions for scroll reveal animations.
 * Notice: 'up' is strictly excluded by design specification.
 */
export type RevealDirection = 'down' | 'left' | 'right' | 'fade';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  readonly direction = input<RevealDirection>('down');
  readonly delay = input<number>(0);
  readonly distance = input<number>(28);
  readonly duration = input<number>(650);
  readonly threshold = input<number>(0.15);
  readonly once = input<boolean>(true);

  private observer: IntersectionObserver | null = null;
  private isRevealed = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      this.revealImmediately();
      return;
    }

    this.applyInitialStyles();
    this.createObserver();
  }

  ngOnDestroy(): void {
    this.destroyObserver();
  }

  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private applyInitialStyles(): void {
    const el = this.el.nativeElement;
    const initialTransform = this.computeInitialTransform();

    this.renderer.setStyle(el, 'opacity', '0');
    this.renderer.setStyle(el, 'transform', initialTransform);
    this.renderer.setStyle(el, 'willChange', 'opacity, transform');
  }

  private computeInitialTransform(): string {
    const dist = this.distance();
    switch (this.direction()) {
      case 'down':
        return `translate3d(0, -${dist}px, 0)`;
      case 'left':
        return `translate3d(-${dist}px, 0, 0)`;
      case 'right':
        return `translate3d(${dist}px, 0, 0)`;
      case 'fade':
      default:
        return 'translate3d(0, 0, 0)';
    }
  }

  private createObserver(): void {
    const rawThreshold = this.threshold();
    const safeThreshold = Math.min(Math.max(rawThreshold, 0), 1);

    const options: IntersectionObserverInit = {
      root: null,
      threshold: safeThreshold,
    };

    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.reveal();
          if (this.once()) {
            this.destroyObserver();
          }
        } else if (!this.once() && this.isRevealed) {
          this.reset();
        }
      }
    }, options);

    this.observer.observe(this.el.nativeElement);
  }

  private reveal(): void {
    this.isRevealed = true;
    const el = this.el.nativeElement;
    const dur = this.duration();
    const del = this.delay();
    const transitionValue = `opacity ${dur}ms cubic-bezier(0.22, 1, 0.36, 1) ${del}ms, transform ${dur}ms cubic-bezier(0.22, 1, 0.36, 1) ${del}ms`;

    this.renderer.setStyle(el, 'transition', transitionValue);
    this.renderer.setStyle(el, 'opacity', '1');
    this.renderer.setStyle(el, 'transform', 'translate3d(0, 0, 0)');
  }

  private reset(): void {
    this.isRevealed = false;
    this.applyInitialStyles();
  }

  private revealImmediately(): void {
    const el = this.el.nativeElement;
    this.renderer.setStyle(el, 'opacity', '1');
    this.renderer.setStyle(el, 'transform', 'none');
  }

  private destroyObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
