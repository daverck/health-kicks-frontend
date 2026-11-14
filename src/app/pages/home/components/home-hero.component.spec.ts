import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { HomeHeroComponent } from './home-hero.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('HomeHeroComponent', () => {
  let component: HomeHeroComponent;
  let fixture: ComponentFixture<HomeHeroComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [HomeHeroComponent],
      providers: [provideRouter([]), TranslationService],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeHeroComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isAuthenticated', false);
    fixture.componentRef.setInput('showWordplay', true);
    fixture.componentRef.setInput('heroVisualMode', 'shoe');
    fixture.componentRef.setInput('activeSimulation', 'walk');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render shoe visual and emit simulationChange when simulation buttons are clicked', () => {
    expect(component).toBeTruthy();
    const simSpy = vi.fn();
    component.simulationChange.subscribe(simSpy);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const fallBtn = Array.from(buttons).find((b: any) => b.textContent?.includes('sim_btn_fall') || b.textContent?.includes('Chute')) as HTMLButtonElement;
    if (fallBtn) {
      fallBtn.click();
      expect(simSpy).toHaveBeenCalledWith('fall');
    }
  });

  it('should emit heroVisualChange when visual switcher tabs are clicked', () => {
    const visualSpy = vi.fn();
    component.heroVisualChange.subscribe(visualSpy);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click(); // second tab ('web')
    expect(visualSpy).toHaveBeenCalledWith('web');
  });

  it('should auto-cycle simulations in shoe mode, then rotate through web and mobile views', () => {
    const simSpy = vi.fn();
    const visualSpy = vi.fn();
    component.simulationChange.subscribe(simSpy);
    component.heroVisualChange.subscribe(visualSpy);

    // Initial is shoe + walk. After 4s -> fall
    vi.advanceTimersByTime(4000);
    expect(simSpy).toHaveBeenCalledWith('fall');

    // Simulate input update to fall
    fixture.componentRef.setInput('activeSimulation', 'fall');
    fixture.detectChanges();

    // After 4s -> idle
    vi.advanceTimersByTime(4000);
    expect(simSpy).toHaveBeenCalledWith('idle');

    // Simulate input update to idle
    fixture.componentRef.setInput('activeSimulation', 'idle');
    fixture.detectChanges();

    // After 4s -> advance to 'web'
    vi.advanceTimersByTime(4000);
    expect(visualSpy).toHaveBeenCalledWith('web');

    // Simulate visual update to 'web'
    fixture.componentRef.setInput('heroVisualMode', 'web');
    fixture.detectChanges();

    // After 4s -> advance to 'mobile'
    vi.advanceTimersByTime(4000);
    expect(visualSpy).toHaveBeenCalledWith('mobile');

    // Simulate visual update to 'mobile'
    fixture.componentRef.setInput('heroVisualMode', 'mobile');
    fixture.detectChanges();

    // After 4s -> loop back to 'shoe' and reset to 'walk'
    vi.advanceTimersByTime(4000);
    expect(visualSpy).toHaveBeenCalledWith('shoe');
    expect(simSpy).toHaveBeenCalledWith('walk');
  });

  it('should pause auto-advance on mouseenter and resume on mouseleave', () => {
    const simSpy = vi.fn();
    component.simulationChange.subscribe(simSpy);

    const card: HTMLElement = fixture.nativeElement.querySelector('.relative.rounded-3xl');
    card.dispatchEvent(new MouseEvent('mouseenter'));
    expect(component.isPaused()).toBe(true);

    vi.advanceTimersByTime(4000);
    expect(simSpy).not.toHaveBeenCalled();

    card.dispatchEvent(new MouseEvent('mouseleave'));
    expect(component.isPaused()).toBe(false);

    vi.advanceTimersByTime(4000);
    expect(simSpy).toHaveBeenCalledWith('fall');
  });
});

