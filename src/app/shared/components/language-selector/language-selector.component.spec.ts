import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSelectorComponent } from './language-selector.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('LanguageSelectorComponent', () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let translationService: TranslationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSelectorComponent],
      providers: [TranslationService],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    translationService = TestBed.inject(TranslationService);
    translationService.setLanguage('fr');
    fixture.detectChanges();
  });

  afterEach(() => {
    translationService.setLanguage('fr');
  });

  it('should create and display current language flag and native name', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    expect(button?.textContent).toContain('🇫🇷');
    expect(button?.textContent).toContain('Français');
  });

  it('should open and close dropdown', () => {
    expect(component.isOpen()).toBeFalse();

    component.toggleDropdown();
    expect(component.isOpen()).toBeTrue();

    component.closeDropdown();
    expect(component.isOpen()).toBeFalse();
  });

  it('should render all 7 language options when open', () => {
    component.toggleDropdown();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.origin-top-right button');
    expect(items.length).toBe(7);
  });

  it('should select language and update TranslationService', () => {
    component.toggleDropdown();
    fixture.detectChanges();

    component.selectLanguage('nl');
    expect(translationService.currentLang()).toBe('nl');
    expect(component.isOpen()).toBeFalse();

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    expect(button?.textContent).toContain('🇳🇱');
    expect(button?.textContent).toContain('Nederlands');
  });
});
