import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { HomeHowItWorksComponent } from './home-how-it-works.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('HomeHowItWorksComponent', () => {
  let fixture: ComponentFixture<HomeHowItWorksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeHowItWorksComponent],
      providers: [TranslationService],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeHowItWorksComponent);
    fixture.componentRef.setInput('steps', [
      { titleKey: 'home.step_1_title', descKey: 'home.step_1_desc' },
      { titleKey: 'home.step_2_title', descKey: 'home.step_2_desc' },
    ]);
    fixture.detectChanges();
  });

  it('should render the steps', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#how')).toBeTruthy();
    const stepCards = compiled.querySelectorAll('#how .rounded-2xl');
    expect(stepCards.length).toBe(2);
  });
});
