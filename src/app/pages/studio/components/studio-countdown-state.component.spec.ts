import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioCountdownStateComponent } from './studio-countdown-state.component';

describe('StudioCountdownStateComponent', () => {
  let component: StudioCountdownStateComponent;
  let fixture: ComponentFixture<StudioCountdownStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioCountdownStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioCountdownStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and emit cancel on click', () => {
    expect(component).toBeTruthy();
    spyOn(component.cancel, 'emit');
    const button = fixture.nativeElement.querySelector('button[type="button"]');
    button.click();
    expect(component.cancel.emit).toHaveBeenCalled();
  });
});
