import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent, TranslatePipe],
      providers: [ThemeService],
    }).compileComponents();

    themeService = TestBed.inject(ThemeService);
    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should switch to dark mode on clicking dark button', () => {
    const darkBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="theme-toggle-dark"]');
    darkBtn.click();
    fixture.detectChanges();
    expect(themeService.themeMode()).toBe('dark');
  });

  it('should switch to light mode on clicking light button', () => {
    const lightBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="theme-toggle-light"]');
    lightBtn.click();
    fixture.detectChanges();
    expect(themeService.themeMode()).toBe('light');
  });
});
