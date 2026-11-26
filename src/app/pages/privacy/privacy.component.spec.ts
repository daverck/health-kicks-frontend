import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render privacy title and sections', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')).toBeTruthy();
    expect(compiled.textContent).toContain('Data Controller & Principles');
    expect(compiled.textContent).toContain('Categories of Data We Process');
    expect(compiled.textContent).toContain('Health Connect (Android)');
    expect(compiled.textContent).toContain('Application Diagnostics (Sentry)');
    expect(compiled.textContent).toContain('Web Analytics (Umami)');
    expect(compiled.textContent).toContain('Wellness & Non-Medical Disclaimer');
    expect(compiled.querySelector('#account-deletion')).toBeTruthy();
  });
});
