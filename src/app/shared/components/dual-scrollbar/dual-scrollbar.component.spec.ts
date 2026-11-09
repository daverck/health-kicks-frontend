import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DualScrollbarComponent } from './dual-scrollbar.component';

@Component({
  standalone: true,
  imports: [DualScrollbarComponent],
  template: `
    <app-dual-scrollbar ariaLabel="Test table region">
      <div style="width: 2000px; height: 100px;">Wide content</div>
    </app-dual-scrollbar>
  `,
})
class TestHostComponent {}

describe('DualScrollbarComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: DualScrollbarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, DualScrollbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const dualScrollbarEl = fixture.debugElement.children[0];
    component = dualScrollbarEl.componentInstance;
  });

  it('should initialize successfully with accessibility attributes', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    const bottomTrack = compiled.querySelector('[data-testid="dual-scrollbar-bottom-track"]') as HTMLElement;
    const topTrack = compiled.querySelector('[data-testid="dual-scrollbar-top-track"]') as HTMLElement;

    expect(bottomTrack).toBeTruthy();
    expect(bottomTrack.getAttribute('tabindex')).toBe('0');
    expect(bottomTrack.getAttribute('role')).toBe('region');
    expect(bottomTrack.getAttribute('aria-label')).toBe('Test table region');

    expect(topTrack).toBeTruthy();
    expect(topTrack.getAttribute('aria-hidden')).toBe('true');
    expect(topTrack.getAttribute('tabindex')).toBe('-1');
  });

  it('should update metrics when content exceeds container width', () => {
    const bottomEl = component.bottomScroll()?.nativeElement;
    if (bottomEl) {
      Object.defineProperty(bottomEl, 'scrollWidth', { value: 1500, configurable: true });
      Object.defineProperty(bottomEl, 'clientWidth', { value: 800, configurable: true });
      component.updateMetrics();

      expect(component.hasOverflow()).toBe(true);
      expect(component.contentWidth()).toBe(1500);
    }
  });

  it('should synchronize scroll position from top to bottom', () => {
    const topEl = component.topScroll()?.nativeElement;
    const bottomEl = component.bottomScroll()?.nativeElement;
    if (topEl && bottomEl) {
      topEl.scrollLeft = 250;
      topEl.dispatchEvent(new Event('scroll'));

      expect(bottomEl.scrollLeft).toBe(250);
    }
  });

  it('should synchronize scroll position from bottom to top', () => {
    const topEl = component.topScroll()?.nativeElement;
    const bottomEl = component.bottomScroll()?.nativeElement;
    if (topEl && bottomEl) {
      bottomEl.scrollLeft = 320;
      bottomEl.dispatchEvent(new Event('scroll'));

      expect(topEl.scrollLeft).toBe(320);
    }
  });

  it('should safely disconnect observers on destroy', () => {
    const disconnectSpy = vi.fn();
    (component as any).resizeObserver = { disconnect: disconnectSpy, observe: vi.fn() };
    (component as any).mutationObserver = { disconnect: disconnectSpy, observe: vi.fn() };

    component.ngOnDestroy();
    expect(disconnectSpy).toHaveBeenCalledTimes(2);
  });
});
