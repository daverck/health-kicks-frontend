import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SupportComponent } from './support.component';

describe('SupportComponent', () => {
  let component: SupportComponent;
  let fixture: ComponentFixture<SupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render support title, status badge link, and docs button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')).toBeTruthy();
    expect(compiled.textContent).toContain('Frequently Asked Questions');

    const statusLink = compiled.querySelector('[data-testid="support-status-badge-link"]');
    const docsBtn = compiled.querySelector('[data-testid="support-docs-button"]');

    expect(statusLink?.getAttribute('href')).toContain('stats.uptimerobot.com');
    expect(docsBtn?.getAttribute('href')).toBe('https://api.healthkicks.eu/docs');
  });
});
