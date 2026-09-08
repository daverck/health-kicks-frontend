import { TestBed } from '@angular/core/testing';
import { TranslatePipe } from './translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let translationService: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslatePipe, TranslationService],
    });
    pipe = TestBed.inject(TranslatePipe);
    translationService = TestBed.inject(TranslationService);
    translationService.setLanguage('fr');
  });

  afterEach(() => {
    translationService.setLanguage('fr');
  });

  it('should transform key to French by default', () => {
    expect(pipe.transform('common.cancel')).toBe('Annuler');
    expect(pipe.transform('nav.dashboard')).toBe('Tableau de bord');
  });

  it('should transform key according to updated language', () => {
    translationService.setLanguage('en');
    expect(pipe.transform('common.cancel')).toBe('Cancel');
    expect(pipe.transform('nav.dashboard')).toBe('Dashboard');

    translationService.setLanguage('es');
    expect(pipe.transform('common.cancel')).toBe('Cancelar');
    expect(pipe.transform('nav.dashboard')).toBe('Panel de Control');
  });

  it('should support parameter interpolation via pipe arguments', () => {
    translationService.setLanguage('fr');
    expect(pipe.transform('dashboard.last_seen', { date: '12:00' })).toBe('Vu : 12:00');

    translationService.setLanguage('en');
    expect(pipe.transform('dashboard.last_seen', { date: '12:00' })).toBe('Seen: 12:00');
  });
});
