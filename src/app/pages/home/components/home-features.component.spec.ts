import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { HomeFeaturesComponent } from './home-features.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('HomeFeaturesComponent', () => {
  let fixture: ComponentFixture<HomeFeaturesComponent>;
  let translationService: TranslationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeFeaturesComponent],
      providers: [TranslationService],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeFeaturesComponent);
    translationService = TestBed.inject(TranslationService);
    translationService.setLanguage('fr');
    fixture.detectChanges();
  });

  it('should render the three feature cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#features')).toBeTruthy();
    expect(compiled.textContent).toContain('Détection de chute en temps réel');
    expect(compiled.textContent).toContain('Podomètre');
    expect(compiled.textContent).toContain('Rappel anti-inactivité prolongée');
  });
});
