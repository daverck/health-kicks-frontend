import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FallHistoryComponent } from './fall-history.component';
import { FallAlertSummary } from '../../../models/api.models';

describe('FallHistoryComponent', () => {
  let component: FallHistoryComponent;
  let fixture: ComponentFixture<FallHistoryComponent>;

  const mockAlerts: FallAlertSummary[] = [
    {
      id: 1,
      uuid: 'alert-uuid-1',
      event_id: 'event-uuid-1',
      user_id: 10,
      user_display_name: 'Patient 1',
      subject_pseudonym: 'SUBJ-001',
      is_pseudonymized: true,
      device_id: 'HK-1',
      event_type: 'fall_forward',
      confidence: 0.95,
      state: 'ACKNOWLEDGED',
      delivery: 'live',
      has_location: true,
      location: { lat: 48.8566, lon: 2.3522 },
      detected_at: '2026-11-01T10:00:00Z',
      notified_contacts_count: 2,
    },
    {
      id: 2,
      uuid: 'alert-uuid-2',
      event_id: 'event-uuid-2',
      user_id: 10,
      user_display_name: 'Patient 1',
      subject_pseudonym: 'SUBJ-001',
      is_pseudonymized: true,
      device_id: 'HK-2',
      event_type: 'fall_backward',
      confidence: 0.88,
      state: 'PENDING',
      delivery: 'live',
      has_location: false,
      detected_at: '2026-11-02T11:00:00Z',
      notified_contacts_count: 0,
    },
    {
      id: 3,
      uuid: 'alert-uuid-3',
      event_id: 'event-uuid-3',
      user_id: 10,
      user_display_name: 'Patient 1',
      subject_pseudonym: 'SUBJ-001',
      is_pseudonymized: true,
      device_id: 'HK-1',
      event_type: 'fall_lateral',
      confidence: 0.92,
      state: 'CANCELLED',
      delivery: 'live',
      has_location: true,
      location: { lat: 48.8566, lon: 2.3522 },
      detected_at: '2026-11-03T12:00:00Z',
      notified_contacts_count: 1,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FallHistoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FallHistoryComponent);
    component = fixture.componentInstance;
    component.alerts = [...mockAlerts];
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute available devices, fall types, and notified counts from alerts', () => {
    expect(component.availableDevices()).toEqual(['HK-1', 'HK-2']);
    expect(component.availableFallTypes()).toEqual(['fall_backward', 'fall_forward', 'fall_lateral']);
    expect(component.availableNotifiedCounts()).toEqual([0, 1, 2]);
  });

  it('should filter alerts by device', () => {
    expect(component.filteredAlerts().length).toBe(3);

    component.onDeviceChange('HK-2');
    expect(component.filteredAlerts().length).toBe(1);
    expect(component.filteredAlerts()[0].id).toBe(2);

    component.onDeviceChange('all');
    expect(component.filteredAlerts().length).toBe(3);
  });

  it('should filter alerts by fall_type', () => {
    component.onFallTypeChange('fall_forward');
    expect(component.filteredAlerts().length).toBe(1);
    expect(component.filteredAlerts()[0].id).toBe(1);

    component.onFallTypeChange('all');
    expect(component.filteredAlerts().length).toBe(3);
  });

  it('should filter alerts by notified_contacts_count', () => {
    component.onNotifiedCountChange('0');
    expect(component.filteredAlerts().length).toBe(1);
    expect(component.filteredAlerts()[0].id).toBe(2);

    component.onNotifiedCountChange('2');
    expect(component.filteredAlerts().length).toBe(1);
    expect(component.filteredAlerts()[0].id).toBe(1);

    component.onNotifiedCountChange('all');
    expect(component.filteredAlerts().length).toBe(3);
  });

  it('should filter alerts by combined device, fall_type, and notified count', () => {
    component.onDeviceChange('HK-1');
    component.onFallTypeChange('fall_forward');
    component.onNotifiedCountChange('2');

    expect(component.filteredAlerts().length).toBe(1);
    expect(component.filteredAlerts()[0].id).toBe(1);

    component.onNotifiedCountChange('0');
    expect(component.filteredAlerts().length).toBe(0);
  });

  it('should emit openDetail when alert is clicked', () => {
    spyOn(component.openDetail, 'emit');
    component.onAlertClick(1);
    expect(component.openDetail.emit).toHaveBeenCalledWith(1);
  });

  it('should emit stateChange when state is selected', () => {
    spyOn(component.stateChange, 'emit');
    component.onStateSelectChange('ACKNOWLEDGED');
    expect(component.stateChange.emit).toHaveBeenCalledWith('ACKNOWLEDGED');
  });
});
