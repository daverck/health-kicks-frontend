import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioActivityCardComponent, StudioLabelItem } from './studio-activity-card.component';

describe('StudioActivityCardComponent', () => {
  let component: StudioActivityCardComponent;
  let fixture: ComponentFixture<StudioActivityCardComponent>;

  const mockLabel: StudioLabelItem = {
    id: 'walk',
    name: 'Marche',
    desc: 'Marche continue à allure naturelle',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioActivityCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioActivityCardComponent);
    component = fixture.componentInstance;
    component.label = mockLabel;
    component.isSelected = false;
    component.isEdgeAi = true;
    component.totalCount = 28;
    component.validatedCount = 20;
    component.pendingCount = 8;
    component.targetPerClass = 25;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display counts and classification badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('28');
    expect(compiled.textContent).toContain('/ 25');
    const badge = compiled.querySelector('[data-testid="studio-activity-classification-badge"]');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('⚡');
  });

  it('should emit selectActivity on click', () => {
    spyOn(component.selectActivity, 'emit');
    const button = fixture.nativeElement.querySelector('button[type="button"]');
    button.click();

    expect(component.selectActivity.emit).toHaveBeenCalledWith('walk');
  });

  it('should emit filterValidated on validated filter button click without triggering card select', () => {
    spyOn(component.selectActivity, 'emit');
    spyOn(component.filterValidated, 'emit');

    const valBtn = fixture.nativeElement.querySelector('[data-testid="btn-filter-validated-walk"]') as HTMLElement;
    valBtn.click();

    expect(component.filterValidated.emit).toHaveBeenCalled();
    expect(component.selectActivity.emit).not.toHaveBeenCalled();
  });

  it('should emit filterPending on pending filter button click without triggering card select', () => {
    spyOn(component.selectActivity, 'emit');
    spyOn(component.filterPending, 'emit');

    const pendBtn = fixture.nativeElement.querySelector('[data-testid="btn-filter-pending-walk"]') as HTMLElement;
    pendBtn.click();

    expect(component.filterPending.emit).toHaveBeenCalled();
    expect(component.selectActivity.emit).not.toHaveBeenCalled();
  });
});
