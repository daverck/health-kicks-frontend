import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { provideRouter } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let translationService: TranslationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), TranslationService],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    translationService = TestBed.inject(TranslationService);
    translationService.setLanguage('fr');
    fixture.detectChanges();
  });

  afterEach(() => {
    translationService.setLanguage('fr');
  });

  it('should create and render navbar with language selector', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    const langSelector = compiled.querySelector('app-language-selector');
    expect(langSelector).toBeTruthy();
  });

  it('should translate navbar links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Connexion');

    translationService.setLanguage('en');
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Sign In');
  });
});
