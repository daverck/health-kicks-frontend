import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RevealDirection, ScrollRevealDirective } from './scroll-reveal.directive';

@Component({
  standalone: true,
  imports: [ScrollRevealDirective],
  template: `
    <div
      id="test-box"
      appScrollReveal
      [direction]="direction"
      [delay]="delay"
      [distance]="distance"
      [duration]="duration"
      [threshold]="threshold"
      [once]="once"
    >
      Test content
    </div>
  `,
})
class TestHostComponent {
  direction: RevealDirection = 'down';
  delay = 0;
  distance = 30;
  duration = 500;
  threshold = 0.2;
  once = true;
}

describe('ScrollRevealDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let element: HTMLElement;
  let observerCallback: IntersectionObserverCallback;
  let observeSpy: ReturnType<typeof vi.fn>;
  let disconnectSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();

    // Mock IntersectionObserver
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = '0px';
      readonly thresholds: ReadonlyArray<number> = [0];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }
      observe = observeSpy;
      unobserve = vi.fn();
      disconnect = disconnectSpy;
      takeRecords = vi.fn().mockReturnValue([]);
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    // Mock matchMedia defaulting to no reduced motion
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    element = fixture.nativeElement.querySelector('#test-box');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize with initial hidden styles for direction="down"', () => {
    fixture.detectChanges();

    expect(element.style.opacity).toBe('0');
    expect(element.style.transform).toBe('translate3d(0, -30px, 0)');
    expect(element.style.willChange).toBe('opacity, transform');
    expect(observeSpy).toHaveBeenCalledWith(element);
  });

  it('should compute appropriate initial transform for direction="left"', () => {
    host.direction = 'left';
    host.distance = 40;
    fixture.detectChanges();

    expect(element.style.transform).toBe('translate3d(-40px, 0, 0)');
  });

  it('should compute appropriate initial transform for direction="right"', () => {
    host.direction = 'right';
    host.distance = 50;
    fixture.detectChanges();

    expect(element.style.transform).toBe('translate3d(50px, 0, 0)');
  });

  it('should compute appropriate initial transform for direction="fade"', () => {
    host.direction = 'fade';
    fixture.detectChanges();

    expect(element.style.transform).toBe('translate3d(0, 0, 0)');
    expect(element.style.opacity).toBe('0');
  });

  it('should reveal element and disconnect observer when intersecting and once=true', () => {
    host.delay = 100;
    host.duration = 600;
    fixture.detectChanges();

    // Trigger intersection
    observerCallback(
      [{ isIntersecting: true, target: element } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(element.style.opacity).toBe('1');
    expect(element.style.transform).toBe('translate3d(0, 0, 0)');
    expect(element.style.transition).toContain('opacity 600ms');
    expect(element.style.transition).toContain('100ms');
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('should reset styles when element exits viewport and once=false', () => {
    host.once = false;
    fixture.detectChanges();

    // 1. Enter viewport
    observerCallback(
      [{ isIntersecting: true, target: element } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(element.style.opacity).toBe('1');
    expect(disconnectSpy).not.toHaveBeenCalled();

    // 2. Exit viewport
    observerCallback(
      [{ isIntersecting: false, target: element } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(element.style.opacity).toBe('0');
    expect(element.style.transform).toBe('translate3d(0, -30px, 0)');
  });

  it('should render immediately visible without motion when prefers-reduced-motion is true', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    const reducedFixture = TestBed.createComponent(TestHostComponent);
    reducedFixture.detectChanges();
    const reducedEl: HTMLElement = reducedFixture.nativeElement.querySelector('#test-box');

    expect(reducedEl.style.opacity).toBe('1');
    expect(reducedEl.style.transform).toBe('none');
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('should do nothing and not throw when running on server platform', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();

    const ssrFixture = TestBed.createComponent(TestHostComponent);
    ssrFixture.detectChanges();
    const ssrEl: HTMLElement = ssrFixture.nativeElement.querySelector('#test-box');

    // On server, neither styles nor observer should be applied
    expect(observeSpy).not.toHaveBeenCalled();
    expect(ssrEl.style.opacity).toBe('');
  });
});
