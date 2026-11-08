import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioHistoryDeleteModalComponent } from './studio-history-delete-modal.component';
import { StudioSessionSummary } from '../../../models/studio-history.model';

describe('StudioHistoryDeleteModalComponent', () => {
  let component: StudioHistoryDeleteModalComponent;
  let fixture: ComponentFixture<StudioHistoryDeleteModalComponent>;

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
      imports: [StudioHistoryDeleteModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioHistoryDeleteModalComponent);
    component = fixture.componentInstance;
    component.session = mockSession;
    fixture.detectChanges();
  });

  it('should render modal with session info and emit confirm on delete', () => {
    expect(component).toBeTruthy();
    spyOn(component.confirm, 'emit');
    const deleteBtn = fixture.nativeElement.querySelector('#confirm-modal-delete-btn') as HTMLElement;
    deleteBtn.click();
    expect(component.confirm.emit).toHaveBeenCalledWith('sess-uuid-1');
  });

  it('should emit cancel on cancel button click', () => {
    spyOn(component.cancel, 'emit');
    const cancelBtn = fixture.nativeElement.querySelector('#cancel-modal-delete-btn') as HTMLElement;
    cancelBtn.click();
    expect(component.cancel.emit).toHaveBeenCalled();
  });
});
