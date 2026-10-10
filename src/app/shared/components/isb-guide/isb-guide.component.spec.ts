import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IsbGuideComponent } from './isb-guide.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('IsbGuideComponent', () => {
  let component: IsbGuideComponent;
  let fixture: ComponentFixture<IsbGuideComponent>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [IsbGuideComponent],
      providers: [{ provide: TranslationService, useValue: mockTranslationService }],
    }).compileComponents();

    fixture = TestBed.createComponent(IsbGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and be collapsed by default', () => {
    expect(component).toBeTruthy();
    expect(component.showIsbGuide()).toBeFalse();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="isb-guide-panel"]')).toBeNull();
  });

  it('should toggle ISB guide panel on button click', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleBtn = compiled.querySelector('[data-testid="toggle-isb-guide-btn"]') as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();

    toggleBtn.click();
    fixture.detectChanges();

    expect(component.showIsbGuide()).toBeTrue();
    expect(compiled.querySelector('[data-testid="isb-guide-panel"]')).not.toBeNull();

    toggleBtn.click();
    fixture.detectChanges();

    expect(component.showIsbGuide()).toBeFalse();
    expect(compiled.querySelector('[data-testid="isb-guide-panel"]')).toBeNull();
  });
});

