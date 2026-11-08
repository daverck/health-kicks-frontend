import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioInspectionHeaderComponent } from './studio-inspection-header.component';

describe('StudioInspectionHeaderComponent', () => {
  let component: StudioInspectionHeaderComponent;
  let fixture: ComponentFixture<StudioInspectionHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioInspectionHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioInspectionHeaderComponent);
    component = fixture.componentInstance;
    component.labelDisplayName = 'Marche';
    component.sessionId = 'sess-123';
    component.selectedDeviceId = 'hk-device-001';
    component.readingsCount = 95;
    fixture.detectChanges();
  });

  it('should create and render session details and action buttons', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#export-session-btn')).toBeTruthy();
    expect(compiled.querySelector('#reject-session-btn')).toBeTruthy();
    expect(compiled.querySelector('#validate-session-btn')).toBeTruthy();
  });

  it('should emit validateSession on click', () => {
    spyOn(component.validateSession, 'emit');
    const valBtn = fixture.nativeElement.querySelector('#validate-session-btn') as HTMLElement;
    valBtn.click();
    expect(component.validateSession.emit).toHaveBeenCalled();
  });
});
