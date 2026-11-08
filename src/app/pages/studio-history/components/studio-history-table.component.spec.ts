import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudioHistoryTableComponent } from './studio-history-table.component';
import { StudioSessionSummary } from '../../../models/studio-history.model';

describe('StudioHistoryTableComponent', () => {
  let component: StudioHistoryTableComponent;
  let fixture: ComponentFixture<StudioHistoryTableComponent>;

  const mockSession: StudioSessionSummary = {
    id: 1,
    uuid: 'sess-uuid-1',
    session_id: 'sess-1',
    device_id: 'hk-01',
    label: 'walk',
    is_validated: true,
    is_hitl: false,
    sample_count: 50,
    duration_sec: 5.0,
    created_at: '2026-11-08T10:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, StudioHistoryTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioHistoryTableComponent);
    component = fixture.componentInstance;
    component.sessions = [mockSession];
    component.getLabelBadgeClass = () => 'bg-blue-50';
    component.getLabelIcon = () => '🚶';
    component.getLabelDisplayName = () => 'Marche';
    component.isEdgeAiActivity = () => true;
    component.isCustomStudioLabel = () => false;
    component.getAuthorDisplayName = () => 'Admin';
    fixture.detectChanges();
  });

  it('should render table rows and badges correctly', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="badge-validated"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="table-badge-edge-ai"]')).toBeTruthy();
  });

  it('should emit inspect when row or inspect button is clicked', () => {
    spyOn(component.inspect, 'emit');
    const inspectBtn = fixture.nativeElement.querySelector('#inspect-btn-sess-uuid-1') as HTMLElement;
    inspectBtn.click();
    expect(component.inspect.emit).toHaveBeenCalledWith(mockSession);
  });
});
