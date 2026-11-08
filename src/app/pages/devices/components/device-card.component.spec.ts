import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DeviceCardComponent } from './device-card.component';
import { mockBoundDevice } from '../../../../testing/mocks/device.mock';

describe('DeviceCardComponent', () => {
  let component: DeviceCardComponent;
  let fixture: ComponentFixture<DeviceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceCardComponent);
    component = fixture.componentInstance;
    component.device = mockBoundDevice;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display device details and not contain shoe emoji/icon', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(mockBoundDevice.device_id);
    expect(compiled.textContent).toContain(mockBoundDevice.name);
    expect(compiled.textContent).not.toContain('👟');
  });

  it('should emit unbind when unbind button is clicked', () => {
    spyOn(component.unbind, 'emit');
    const unbindButton = fixture.nativeElement.querySelector('button[type="button"]');
    unbindButton.click();

    expect(component.unbind.emit).toHaveBeenCalledWith(mockBoundDevice);
  });
});
