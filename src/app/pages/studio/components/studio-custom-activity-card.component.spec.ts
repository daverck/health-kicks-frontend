import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { StudioCustomActivityCardComponent } from './studio-custom-activity-card.component';

describe('StudioCustomActivityCardComponent', () => {
  let component: StudioCustomActivityCardComponent;
  let fixture: ComponentFixture<StudioCustomActivityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, StudioCustomActivityCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioCustomActivityCardComponent);
    component = fixture.componentInstance;
    component.isActive = false;
    component.customLabel = 'jump';
    component.effectiveLabel = 'jump';
    component.isCustomStudioLabel = true;
    component.count = 5;
    component.targetPerClass = 25;
    fixture.detectChanges();
  });

  it('should create and render custom activity card with input and badge', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="studio-custom-label-card"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="studio-custom-classification-badge"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="custom-label-experimental-hint"]')).toBeTruthy();
  });

  it('should emit cardClick on select', () => {
    spyOn(component.cardClick, 'emit');
    const card = fixture.nativeElement.querySelector('[data-testid="studio-custom-label-card"]') as HTMLElement;
    card.click();
    expect(component.cardClick.emit).toHaveBeenCalled();
  });

  it('should emit clearLabel on clear click', () => {
    spyOn(component.clearLabel, 'emit');
    const clearBtn = fixture.nativeElement.querySelector('button[type="button"]') as HTMLElement;
    expect(clearBtn).toBeTruthy();
    clearBtn.click();
    expect(component.clearLabel.emit).toHaveBeenCalled();
  });
});
