import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { provideRouter } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { AuthService } from '../../core/services/auth.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let translationService: TranslationService;
  let isAuthenticatedSignal: WritableSignal<boolean>;

  beforeEach(async () => {
    isAuthenticatedSignal = signal(false);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        TranslationService,
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: isAuthenticatedSignal.asReadonly(),
          },
        },
      ],
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

  it('should translate navbar and hero content when language changes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Connexion');
    expect(compiled.textContent).toContain('Clip universel sur lacets');

    translationService.setLanguage('en');
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Sign In');
    expect(compiled.textContent).toContain('Universal Shoelace Clip');
  });

  it('should render unauthenticated CTAs when user is not logged in', () => {
    isAuthenticatedSignal.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    // Navbar has login link and register button
    const navLogin = compiled.querySelector('header a[routerlink="/login"]');
    const navRegister = compiled.querySelector('header a[routerlink="/register"]');
    const navDashboard = compiled.querySelector('header a[routerlink="/dashboard"]');
    expect(navLogin).toBeTruthy();
    expect(navRegister).toBeTruthy();
    expect(navDashboard).toBeNull();

    // Hero has register primary CTA and concept anchor
    const heroCtas = compiled.querySelectorAll('section a');
    const heroRegister = compiled.querySelector('section a[routerlink="/register"]');
    expect(heroRegister?.textContent?.trim()).toContain('Commencer gratuitement');

    // Bottom CTA has register button and subtle login link
    const ctaSection = compiled.querySelectorAll('section')[4];
    expect(ctaSection?.textContent).toContain('Commencer gratuitement');
    expect(ctaSection?.textContent).toContain('Déjà un compte ? Se connecter');
  });

  it('should render authenticated CTAs when user is logged in', () => {
    isAuthenticatedSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    // Navbar has member space button, but no login/register
    const navLogin = compiled.querySelector('header a[routerlink="/login"]');
    const navRegister = compiled.querySelector('header a[routerlink="/register"]');
    const navDashboard = compiled.querySelector('header a[routerlink="/dashboard"]');
    expect(navLogin).toBeNull();
    expect(navRegister).toBeNull();
    expect(navDashboard).toBeTruthy();
    expect(navDashboard?.textContent?.trim()).toBe('Espace Membre');

    // Hero has single primary CTA to dashboard
    const heroDashboard = compiled.querySelector('section a[routerlink="/dashboard"]');
    expect(heroDashboard).toBeTruthy();
    expect(heroDashboard?.textContent?.trim()).toContain('Accéder à mon espace');

    // Bottom CTA has single dashboard button and no login link
    const ctaSection = compiled.querySelectorAll('section')[4];
    expect(ctaSection?.textContent).toContain('Accéder à mon espace');
    expect(ctaSection?.textContent).not.toContain('Déjà un compte ? Se connecter');
  });

  it('should highlight the shoe-clip concept and roadmap features', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Concept section
    const concept = compiled.querySelector('#concept');
    expect(concept?.textContent).toContain('Clip universel sur lacets');
    expect(concept?.textContent).toContain('Économique & Léger');
    expect(concept?.textContent).toContain('Discret & Bienveillant');

    // Features section with roadmap items
    const features = compiled.querySelector('#features');
    expect(features?.textContent).toContain('Détection de chute en temps réel');
    expect(features?.textContent).toContain('Stimulation haptique à distance');
    expect(features?.textContent).toContain('Comptage des pas');
    expect(features?.textContent).toContain('Rappel anti-inactivité prolongée');
    expect(features?.textContent).toContain('Bientôt disponible');
  });

  it('should display the wordplay note in French and hide it in English', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Le saviez-vous ?');
    expect(compiled.textContent).toContain('« Kicks » est le terme familier désignant les baskets et chaussures');
    expect(component.showWordplay()).toBeTrue();

    translationService.setLanguage('en');
    fixture.detectChanges();
    expect(component.showWordplay()).toBeFalse();
    expect(compiled.textContent).not.toContain('Did you know?');
    expect(compiled.textContent).not.toContain('Le saviez-vous ?');
  });

  it('should render the shoe photo and toggle interactive simulation modes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const img = compiled.querySelector('img[src="/images/shoe-clip-device.jpg"]');
    expect(img).toBeTruthy();

    // Default simulation is walk
    expect(component.activeSimulation()).toBe('walk');
    expect(compiled.textContent).toContain('rythme et équilibre stables');

    // Switch to fall simulation
    component.setSimulation('fall');
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Chute détectée par IA embarquée');

    // Switch to haptic simulation
    component.setSimulation('haptic');
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Onde vibratoire transmise aux lacets');

    // Switch to idle simulation
    component.setSimulation('idle');
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Station assise prolongée');
  });
});
