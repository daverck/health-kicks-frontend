import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';
import { LANGUAGE_STORAGE_KEY } from '../i18n/i18n.models';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');

    TestBed.configureTestingModule({});
    service = TestBed.inject(TranslationService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'fr');
  });

  it('should be created and default to French', () => {
    expect(service).toBeTruthy();
    expect(service.currentLang()).toBe('fr');
    expect(service.dir()).toBe('ltr');
    expect(service.isRtl()).toBeFalse();
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('fr');
  });

  it('should list all 7 supported languages', () => {
    expect(service.supportedLanguages.length).toBe(7);
    const codes = service.supportedLanguages.map((l) => l.code);
    expect(codes).toContain('fr');
    expect(codes).toContain('en');
    expect(codes).toContain('nl');
    expect(codes).toContain('es');
    expect(codes).toContain('zh');
    expect(codes).toContain('ar');
    expect(codes).toContain('de');
  });

  it('should change language, update localStorage and DOM attributes', () => {
    service.setLanguage('en');

    expect(service.currentLang()).toBe('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(service.isRtl()).toBeFalse();
  });

  it('should activate RTL mode when Arabic is selected', () => {
    service.setLanguage('ar');

    expect(service.currentLang()).toBe('ar');
    expect(service.isRtl()).toBeTrue();
    expect(service.dir()).toBe('rtl');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');

    // Switch back to German
    service.setLanguage('de');
    expect(service.currentLang()).toBe('de');
    expect(service.isRtl()).toBeFalse();
    expect(service.dir()).toBe('ltr');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('should translate keys correctly across multiple languages', () => {
    // French (default)
    expect(service.translate('common.save')).toBe('Enregistrer');
    expect(service.translate('studio.step_idle')).toBe('Prêt');

    // English
    service.setLanguage('en');
    expect(service.translate('common.save')).toBe('Save');
    expect(service.translate('studio.step_idle')).toBe('Ready');

    // Dutch
    service.setLanguage('nl');
    expect(service.translate('common.save')).toBe('Opslaan');
    expect(service.translate('studio.step_idle')).toBe('Gereed');

    // Spanish
    service.setLanguage('es');
    expect(service.translate('common.save')).toBe('Guardar');
    expect(service.translate('studio.step_idle')).toBe('Listo');

    // Chinese
    service.setLanguage('zh');
    expect(service.translate('common.save')).toBe('保存');
    expect(service.translate('studio.step_idle')).toBe('就绪');

    // Arabic
    service.setLanguage('ar');
    expect(service.translate('common.save')).toBe('حفظ');
    expect(service.translate('studio.step_idle')).toBe('جاهز');

    // German
    service.setLanguage('de');
    expect(service.translate('common.save')).toBe('Speichern');
    expect(service.translate('studio.step_idle')).toBe('Bereit');
  });

  it('should interpolate parameters in translation strings', () => {
    service.setLanguage('fr');
    expect(service.translate('dashboard.vibration_sent', { device: 'HK-01' })).toBe(
      'Vibration envoyée à HK-01 !'
    );

    service.setLanguage('en');
    expect(service.translate('dashboard.vibration_sent', { device: 'HK-01' })).toBe(
      'Vibration sent to HK-01!'
    );

    service.setLanguage('de');
    expect(service.translate('dashboard.vibration_sent', { device: 'HK-01' })).toBe(
      'Vibration an HK-01 gesendet!'
    );
  });

  it('should return fallback or key itself when translation is missing', () => {
    service.setLanguage('en');
    // Non-existent key in both current and fallback
    expect(service.translate('non_existent.key')).toBe('non_existent.key');
    // Empty key returns empty string
    expect(service.translate('')).toBe('');
  });
});
