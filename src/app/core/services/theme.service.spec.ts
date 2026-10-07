import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let doc: Document;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    doc = TestBed.inject(DOCUMENT);
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    doc.documentElement.classList.remove('dark');
  });

  it('should initialize with system mode by default', () => {
    expect(service.themeMode()).toBe('system');
  });

  it('should set dark theme and add dark class to root document', () => {
    service.setTheme('dark');
    expect(service.themeMode()).toBe('dark');
    expect(service.isDark()).toBeTrue();
    expect(doc.documentElement.classList.contains('dark')).toBeTrue();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('should set light theme and remove dark class from root document', () => {
    service.setTheme('dark');
    service.setTheme('light');
    expect(service.themeMode()).toBe('light');
    expect(service.isDark()).toBeFalse();
    expect(doc.documentElement.classList.contains('dark')).toBeFalse();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('should toggle theme between light and dark', () => {
    service.setTheme('light');
    expect(service.isDark()).toBeFalse();

    service.toggleTheme();
    expect(service.isDark()).toBeTrue();
    expect(service.themeMode()).toBe('dark');

    service.toggleTheme();
    expect(service.isDark()).toBeFalse();
    expect(service.themeMode()).toBe('light');
  });
});
