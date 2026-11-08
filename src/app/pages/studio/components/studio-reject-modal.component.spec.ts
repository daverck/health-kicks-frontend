import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioRejectModalComponent } from './studio-reject-modal.component';

describe('StudioRejectModalComponent', () => {
  let component: StudioRejectModalComponent;
  let fixture: ComponentFixture<StudioRejectModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioRejectModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioRejectModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render dialog', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="delete-confirm-modal"]')).toBeTruthy();
  });

  it('should emit cancel on cancel button click', () => {
    spyOn(component.cancel, 'emit');
    const cancelBtn = fixture.nativeElement.querySelector('button[type="button"]') as HTMLElement;
    cancelBtn.click();
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should emit confirm on confirm button click', () => {
    spyOn(component.confirm, 'emit');
    const confirmBtn = fixture.nativeElement.querySelector('#confirm-reject-btn') as HTMLElement;
    confirmBtn.click();
    expect(component.confirm.emit).toHaveBeenCalled();
  });
});
