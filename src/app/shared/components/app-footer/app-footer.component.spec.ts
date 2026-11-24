import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppFooterComponent } from './app-footer.component';

describe('AppFooterComponent', () => {
  let component: AppFooterComponent;
  let fixture: ComponentFixture<AppFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppFooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render full variant by default with legal and platform links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="app-footer-full"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="app-footer-compact"]')).toBeFalsy();

    const termsLink = compiled.querySelector('[data-testid="footer-link-terms"]');
    const privacyLink = compiled.querySelector('[data-testid="footer-link-privacy"]');
    const gdprLink = compiled.querySelector('[data-testid="footer-link-gdpr"]');
    const supportLink = compiled.querySelector('[data-testid="footer-link-support"]');
    const githubLink = compiled.querySelector('[data-testid="footer-link-github"]');
    const statusBadge = compiled.querySelector('[data-testid="footer-status-badge"]');

    expect(termsLink).toBeTruthy();
    expect(privacyLink).toBeTruthy();
    expect(gdprLink).toBeTruthy();
    expect(supportLink).toBeTruthy();
    expect(githubLink?.getAttribute('href')).toBe('https://github.com/daverck/health-kicks-ecosystem');
    expect(statusBadge).toBeFalsy();
  });

  it('should render compact variant when input is set to compact', () => {
    fixture.componentRef.setInput('variant', 'compact');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="app-footer-compact"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="app-footer-full"]')).toBeFalsy();

    const termsLink = compiled.querySelector('[data-testid="compact-footer-link-terms"]');
    const githubLink = compiled.querySelector('[data-testid="compact-footer-link-github"]');
    const statusBadge = compiled.querySelector('[data-testid="compact-footer-status-badge"]');

    expect(termsLink).toBeTruthy();
    expect(githubLink?.getAttribute('href')).toBe('https://github.com/daverck/health-kicks-ecosystem');
    expect(statusBadge).toBeFalsy();
  });
});
