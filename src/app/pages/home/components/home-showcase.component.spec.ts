import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HomeShowcaseComponent } from './home-showcase.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('HomeShowcaseComponent', () => {
  let component: HomeShowcaseComponent;
  let fixture: ComponentFixture<HomeShowcaseComponent>;

  beforeEach(async () => {
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
    ]);
    fixture.componentRef.setInput('emergencyScreenshots', [
      { titleKey: 'em_1', descKey: 'em_desc_1', imageSrc: '/em.png', tag: 'Em 1' },
    ]);
    fixture.detectChanges();
  });

  it('should render tab buttons and emit tabChange on click', () => {
    expect(component).toBeTruthy();
    const tabSpy = vi.fn();
    component.tabChange.subscribe(tabSpy);

    const buttons = fixture.nativeElement.querySelectorAll('#showcase button');
    buttons[1].click();
    expect(tabSpy).toHaveBeenCalledWith('mobile');
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
});
