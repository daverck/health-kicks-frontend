import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioRecordingStateComponent } from './studio-recording-state.component';

describe('StudioRecordingStateComponent', () => {
  let component: StudioRecordingStateComponent;
  let fixture: ComponentFixture<StudioRecordingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioRecordingStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioRecordingStateComponent);
    component = fixture.componentInstance;
    component.effectiveLabel = 'run';
    component.displayLabel = 'Course';
    component.progressPercent = 50;
    fixture.detectChanges();
  });

  it('should create and render progress bar', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('2.5s / 5.0s');
  });
});
