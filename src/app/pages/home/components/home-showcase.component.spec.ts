import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HomeShowcaseComponent } from './home-showcase.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('HomeShowcaseComponent', () => {
  let component: HomeShowcaseComponent;
  let fixture: ComponentFixture<HomeShowcaseComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [HomeShowcaseComponent],
      providers: [TranslationService],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeShowcaseComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('activeAppTab', 'web');
    fixture.componentRef.setInput('selectedWebScreenshot', 0);
    fixture.componentRef.setInput('selectedMobileScreenshot', 0);
    fixture.componentRef.setInput('selectedEmergencyScreenshot', 0);
    fixture.componentRef.setInput('webScreenshots', [
      { titleKey: 'title_1', descKey: 'desc_1', imageSrc: '/test.png', tag: 'Web 1' },
      { titleKey: 'title_2', descKey: 'desc_2', imageSrc: '/test2.png', tag: 'Web 2' },
    ]);
    fixture.componentRef.setInput('mobileScreenshots', [
      { titleKey: 'mob_1', descKey: 'mob_desc_1', imageSrc: '/mob.png', tag: 'Mob 1' },
      { titleKey: 'mob_2', descKey: 'mob_desc_2', imageSrc: '/mob2.png', tag: 'Mob 2' },
    ]);
    fixture.componentRef.setInput('emergencyScreenshots', [
      { titleKey: 'em_1', descKey: 'em_desc_1', imageSrc: '/em.png', tag: 'Em 1' },
      { titleKey: 'em_2', descKey: 'em_desc_2', imageSrc: '/em2.png', tag: 'Em 2' },
    ]);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render tab buttons and emit tabChange on click with index reset', () => {
    expect(component).toBeTruthy();
    const tabSpy = vi.fn();
    const mobileSpy = vi.fn();
    component.tabChange.subscribe(tabSpy);
    component.selectMobile.subscribe(mobileSpy);

    const buttons = fixture.nativeElement.querySelectorAll('#showcase button');
    buttons[1].click();
    expect(tabSpy).toHaveBeenCalledWith('mobile');
    expect(mobileSpy).toHaveBeenCalledWith(0);
  });

  it('should emit selectWeb when a web card is clicked', () => {
    const webSpy = vi.fn();
    component.selectWeb.subscribe(webSpy);

    const cards = fixture.nativeElement.querySelectorAll('.grid button');
    if (cards.length > 1) {
      cards[1].click();
      expect(webSpy).toHaveBeenCalledWith(1);
    }
  });

  it('should auto-advance screenshot in web tab every 4s, then switch to mobile tab', () => {
    const selectWebSpy = vi.fn();
    const tabChangeSpy = vi.fn();
    const selectMobileSpy = vi.fn();
    component.selectWeb.subscribe(selectWebSpy);
    component.tabChange.subscribe(tabChangeSpy);
    component.selectMobile.subscribe(selectMobileSpy);

    // Initial is web screenshot 0. Advance 4s -> should select screenshot 1
    vi.advanceTimersByTime(4000);
    expect(selectWebSpy).toHaveBeenCalledWith(1);

    // Update input to simulate parent updating state to screenshot 1
    fixture.componentRef.setInput('selectedWebScreenshot', 1);
    fixture.detectChanges();

    // Next 4s -> since 1 is last web screenshot, should switch to mobile tab at index 0
    vi.advanceTimersByTime(4000);
    expect(tabChangeSpy).toHaveBeenCalledWith('mobile');
    expect(selectMobileSpy).toHaveBeenCalledWith(0);
  });

  it('should auto-advance through mobile and emergency tabs and loop back to web', () => {
    const tabChangeSpy = vi.fn();
    const selectEmergencySpy = vi.fn();
    const selectWebSpy = vi.fn();
    component.tabChange.subscribe(tabChangeSpy);
    component.selectEmergency.subscribe(selectEmergencySpy);
    component.selectWeb.subscribe(selectWebSpy);

    // Setup mobile tab at last screenshot
    fixture.componentRef.setInput('activeAppTab', 'mobile');
    fixture.componentRef.setInput('selectedMobileScreenshot', 1);
    fixture.detectChanges();

    vi.advanceTimersByTime(4000);
    expect(tabChangeSpy).toHaveBeenCalledWith('emergency');
    expect(selectEmergencySpy).toHaveBeenCalledWith(0);

    // Setup emergency tab at last screenshot
    fixture.componentRef.setInput('activeAppTab', 'emergency');
    fixture.componentRef.setInput('selectedEmergencyScreenshot', 1);
    fixture.detectChanges();

    vi.advanceTimersByTime(4000);
    expect(tabChangeSpy).toHaveBeenCalledWith('web');
    expect(selectWebSpy).toHaveBeenCalledWith(0);
  });

  it('should pause auto-advance on mouseenter and resume on mouseleave', () => {
    const selectWebSpy = vi.fn();
    component.selectWeb.subscribe(selectWebSpy);

    const section: HTMLElement = fixture.nativeElement.querySelector('#showcase');
    section.dispatchEvent(new MouseEvent('mouseenter'));
    expect(component.isPaused()).toBe(true);

    vi.advanceTimersByTime(4000);
    expect(selectWebSpy).not.toHaveBeenCalled();

    section.dispatchEvent(new MouseEvent('mouseleave'));
    expect(component.isPaused()).toBe(false);

    vi.advanceTimersByTime(4000);
    expect(selectWebSpy).toHaveBeenCalledWith(1);
  });
});

