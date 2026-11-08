import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioHistoryMobileCardComponent } from './studio-history-mobile-card.component';
import { StudioSessionSummary } from '../../../models/studio-history.model';

describe('StudioHistoryMobileCardComponent', () => {
  let component: StudioHistoryMobileCardComponent;
  let fixture: ComponentFixture<StudioHistoryMobileCardComponent>;

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
      imports: [StudioHistoryMobileCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioHistoryMobileCardComponent);
    component = fixture.componentInstance;
    component.session = mockSession;
    component.labelDisplayName = 'Marche';
    component.labelIcon = '🚶';
    component.isEdgeAi = true;
    fixture.detectChanges();
  });

  it('should render session card and emit inspect on click', () => {
    expect(component).toBeTruthy();
    spyOn(component.inspect, 'emit');
    const card = fixture.nativeElement.querySelector('[data-testid="mobile-session-card-sess-uuid-1"]') as HTMLElement;
    card.click();
    expect(component.inspect.emit).toHaveBeenCalledWith(mockSession);
  });

  it('should emit delete on delete button click', () => {
    spyOn(component.delete, 'emit');
    const deleteBtn = fixture.nativeElement.querySelector('#delete-mobile-btn-sess-uuid-1') as HTMLElement;
    deleteBtn.click();
    expect(component.delete.emit).toHaveBeenCalled();
  });
});
