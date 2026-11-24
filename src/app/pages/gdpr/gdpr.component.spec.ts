import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GdprComponent } from './gdpr.component';

describe('GdprComponent', () => {
  let component: GdprComponent;
  let fixture: ComponentFixture<GdprComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GdprComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GdprComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render GDPR title and articles matrix', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')).toBeTruthy();
    expect(compiled.textContent).toContain('GDPR Architecture & Rights Matrix');
    expect(compiled.textContent).toContain('Data Protection Officer');
    expect(compiled.textContent).toContain('APD / GBA');
    expect(compiled.textContent).toContain('Belgium');

    const article32Card = compiled.querySelector('[data-testid="gdpr-article-32-card"]');
    expect(article32Card).toBeTruthy();
    expect(article32Card?.textContent).toContain('BLE GATT Security');
    expect(article32Card?.textContent).toContain('LESC (Low Energy Secure Connections)');
    expect(article32Card?.textContent).toContain('encrypted SQLite on mobile');
    expect(article32Card?.textContent).toContain('TLS 1.3 / AWS SigV4');
    expect(article32Card?.textContent).toContain('AES-256 encryption at rest');
  });
});
