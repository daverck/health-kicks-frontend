import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioCoverageSummaryComponent } from './studio-coverage-summary.component';

describe('StudioCoverageSummaryComponent', () => {
  let component: StudioCoverageSummaryComponent;
  let fixture: ComponentFixture<StudioCoverageSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioCoverageSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioCoverageSummaryComponent);
    component = fixture.componentInstance;
    component.totalSessions = 80;
    component.classesReachingTarget = 2;
    component.totalPredefinedClasses = 7;
    component.targetPerClass = 25;
    component.isLoadingStats = false;
    fixture.detectChanges();
  });

  it('should create and render dataset stats summary', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#dataset-stats-summary')).toBeTruthy();
    expect(compiled.querySelector('#total-sessions-count')?.textContent).toContain('80');
  });
});
