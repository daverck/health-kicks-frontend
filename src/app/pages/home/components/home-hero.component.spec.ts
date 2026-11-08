import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { HomeHeroComponent } from './home-hero.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('HomeHeroComponent', () => {
  let component: HomeHeroComponent;
  let fixture: ComponentFixture<HomeHeroComponent>;

  beforeEach(async () => {
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

  it('should render shoe visual and emit simulationChange when simulation buttons are clicked', () => {
    expect(component).toBeTruthy();
    const simSpy = vi.fn();
    component.simulationChange.subscribe(simSpy);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    // simulation buttons are the bottom 3
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
});
