import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioModelsFirmwareCardComponent } from './studio-models-firmware-card.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

describe('StudioModelsFirmwareCardComponent', () => {
  let component: StudioModelsFirmwareCardComponent;
  let fixture: ComponentFixture<StudioModelsFirmwareCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioModelsFirmwareCardComponent, TranslatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioModelsFirmwareCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('flashUsagePct', 1.25);
    fixture.componentRef.setInput('ramUsagePct', 6.4);
    fixture.componentRef.setInput('cHeaderSizeBytes', 38450);
    fixture.detectChanges();
  });

  it('should render firmware stats', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('1.25%');
    expect(fixture.nativeElement.textContent).toContain('6.40%');
  });
});
