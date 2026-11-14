import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HomeScreenshotCardComponent } from './home-screenshot-card.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('HomeScreenshotCardComponent', () => {
  let component: HomeScreenshotCardComponent;
  let fixture: ComponentFixture<HomeScreenshotCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeScreenshotCardComponent],
      providers: [TranslationService],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeScreenshotCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', {
      titleKey: 'card_title',
      descKey: 'card_desc',
      imageSrc: '/test.png',
      tag: 'Test Tag',
    });
    fixture.componentRef.setInput('index', 0);
    fixture.detectChanges();
  });

  it('should render card details and formatted index', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Tag');
    expect(compiled.textContent).toContain('01');
  });

  it('should emit cardClick when the button is clicked', () => {
    const clickSpy = vi.fn();
    component.cardClick.subscribe(clickSpy);

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should apply emergency classes when theme is emergency', () => {
    fixture.componentRef.setInput('theme', 'emergency');
    fixture.componentRef.setInput('isSelected', true);
    fixture.componentRef.setInput('stepPrefix', 'Étape ');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Étape 01');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('border-red-500');
  });

  it('should render mobile svg icon when iconType is mobile', () => {
    fixture.componentRef.setInput('iconType', 'mobile');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('span svg');
    expect(svg).toBeTruthy();
  });
});
