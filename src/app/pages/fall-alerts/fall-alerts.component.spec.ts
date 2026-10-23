import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';
import { FallAlertsComponent } from './fall-alerts.component';
import { FallAlertService } from '../../core/services/fall-alert.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  AlertContactResponse,
  FallAlertDetail,
  FallAlertSummary,
  PaginatedFallAlertsResponse,
  UserResponse,
} from '../../models/api.models';

describe('FallAlertsComponent', () => {
  let component: FallAlertsComponent;
  let fixture: ComponentFixture<FallAlertsComponent>;
  let fallAlertServiceSpy: jasmine.SpyObj<FallAlertService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let userSignal: WritableSignal<UserResponse | null>;

  const mockUser: UserResponse = {
    id: 3,
    email: 'jean@example.com',
    name: 'Jean Martin',
    role: 'user',
    is_active: true,
  };

  const mockAlertSummary: FallAlertSummary = {
    id: 42,
    event_id: '0b6f4b1e-6a51-4c1f-9a3e-2d7f1c9b8e10',
    user_id: 3,
    user_display_name: 'Jean Martin',
    subject_pseudonym: 'SUBJ-A8F19C2D',
    is_pseudonymized: false,
    device_id: 'HK-1',
    event_type: 'fall_forward',
    confidence: 0.91,
    state: 'ACKNOWLEDGED',
    cancel_reason: null,
    delivery: 'live',
    has_location: true,
    detected_at: '2026-10-23T08:39:03Z',
    escalation_started_at: '2026-10-23T08:40:03Z',
    closed_at: '2026-10-23T08:44:51Z',
    acknowledged_by: { first_name: 'Paul', last_name: 'Martin' },
    notified_contacts_count: 2,
  };

  const mockAlertDetail: FallAlertDetail = {
    ...mockAlertSummary,
    location: {
      lat: 50.8466,
      lon: 4.3528,
      accuracy_m: 12.5,
      captured_at: '2026-10-23T08:39:01Z',
    },
    notifications: [
      {
        id: 101,
        rank: 1,
        contact_first_name: 'Marie',
        contact_last_name: 'Dupont',
        contact_email: 'marie.dupont@example.com',
        status: 'SENT',
        sent_at: '2026-10-23T08:40:04Z',
        acknowledged_at: null,
        error_message: null,
      },
      {
        id: 102,
        rank: 2,
        contact_first_name: 'Paul',
        contact_last_name: 'Martin',
        contact_email: 'paul.martin@example.com',
        status: 'ACKNOWLEDGED',
        sent_at: '2026-10-23T08:43:04Z',
        acknowledged_at: '2026-10-23T08:44:51Z',
        error_message: null,
      },
    ],
  };

  const mockContacts: AlertContactResponse[] = [
    {
      id: 7,
      first_name: 'Marie',
      last_name: 'Dupont',
      email: 'marie.dupont@example.com',
      priority: 1,
      last_test_email_at: null,
      created_at: '2026-10-23T08:00:00Z',
      updated_at: '2026-10-23T08:00:00Z',
    },
    {
      id: 9,
      first_name: 'Paul',
      last_name: 'Martin',
      email: 'paul.martin@example.com',
      priority: 2,
      last_test_email_at: '2026-10-23T08:10:00Z',
      created_at: '2026-10-23T08:00:00Z',
      updated_at: '2026-10-23T08:10:00Z',
    },
  ];

  const mockPage: PaginatedFallAlertsResponse = {
    items: [mockAlertSummary],
    total: 1,
    page: 1,
    page_size: 20,
  };

  beforeEach(async () => {
    userSignal = signal<UserResponse | null>(mockUser);
    fallAlertServiceSpy = jasmine.createSpyObj<FallAlertService>('FallAlertService', [
      'listFallAlerts',
      'getFallAlertDetail',
      'listAlertContacts',
      'addAlertContact',
      'updateAlertContact',
      'deleteAlertContact',
      'reorderAlertContacts',
      'sendTestEmail',
    ]);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);

    fallAlertServiceSpy.listFallAlerts.and.returnValue(of(mockPage));
    fallAlertServiceSpy.listAlertContacts.and.returnValue(of(mockContacts));
    fallAlertServiceSpy.getFallAlertDetail.and.returnValue(of(mockAlertDetail));

    await TestBed.configureTestingModule({
      imports: [FallAlertsComponent],
      providers: [
        { provide: FallAlertService, useValue: fallAlertServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        {
          provide: AuthService,
          useValue: {
            user: userSignal,
            currentUser: userSignal,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FallAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load alert history and contacts on init', () => {
    expect(component).toBeTruthy();
    expect(fallAlertServiceSpy.listFallAlerts).toHaveBeenCalled();
    expect(fallAlertServiceSpy.listAlertContacts).toHaveBeenCalled();
    expect(component.alerts().length).toBe(1);
    expect(component.contacts().length).toBe(2);
  });

  it('should filter alerts by state and open detail modal with notification timeline', () => {
    component.onStateChange('ACKNOWLEDGED');
    expect(component.selectedState()).toBe('ACKNOWLEDGED');
    expect(fallAlertServiceSpy.listFallAlerts).toHaveBeenCalledWith(
      jasmine.objectContaining({ state: 'ACKNOWLEDGED', page: 1 })
    );

    component.openAlertDetail(42);
    fixture.detectChanges();

    expect(fallAlertServiceSpy.getFallAlertDetail).toHaveBeenCalledWith(42);
    expect(component.selectedAlertDetail()).toEqual(mockAlertDetail);

    const modal = fixture.nativeElement.querySelector('[data-testid="alert-detail-modal"]');
    expect(modal).toBeTruthy();
    const mapLink: HTMLAnchorElement | null = modal.querySelector('[data-testid="detail-google-maps-link"]');
    expect(mapLink?.getAttribute('href')).toBe('https://www.google.com/maps?q=50.8466,4.3528');

    const timelineItems = modal.querySelectorAll('[data-testid="notification-timeline-item"]');
    expect(timelineItems.length).toBe(2);

    component.closeAlertDetail();
    expect(component.selectedAlertDetail()).toBeNull();
  });

  it('should switch to contacts tab and add a new emergency contact', () => {
    component.setTab('contacts');
    fixture.detectChanges();

    expect(component.activeTab()).toBe('contacts');
    const banner = fixture.nativeElement.querySelector('[data-testid="contacts-info-banner"]');
    expect(banner?.textContent).toContain('Surveillance Active');

    fallAlertServiceSpy.addAlertContact.and.returnValue(
      of({
        id: 12,
        first_name: 'Claire',
        last_name: 'Bernard',
        email: 'claire.bernard@example.com',
        priority: 3,
        last_test_email_at: null,
        created_at: '2026-10-23T09:00:00Z',
        updated_at: '2026-10-23T09:00:00Z',
      })
    );

    component.contactForm.setValue({
      first_name: 'Claire',
      last_name: 'Bernard',
      email: 'Claire.Bernard@example.com',
    });
    component.onSubmitContact();

    expect(fallAlertServiceSpy.addAlertContact).toHaveBeenCalledWith({
      first_name: 'Claire',
      last_name: 'Bernard',
      email: 'claire.bernard@example.com',
    });
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });

  it('should edit, reorder, send test email, and delete an emergency contact', () => {
    component.setTab('contacts');
    fixture.detectChanges();

    // Edit
    component.startEditContact(mockContacts[0]);
    expect(component.editingContact()).toEqual(mockContacts[0]);
    component.contactForm.patchValue({ last_name: 'Dupont-Martin' });
    fallAlertServiceSpy.updateAlertContact.and.returnValue(
      of({ ...mockContacts[0], last_name: 'Dupont-Martin' })
    );
    component.onSubmitContact();
    expect(fallAlertServiceSpy.updateAlertContact).toHaveBeenCalledWith(7, {
      first_name: 'Marie',
      last_name: 'Dupont-Martin',
      email: 'marie.dupont@example.com',
    });

    // Reorder (move second contact up)
    fallAlertServiceSpy.reorderAlertContacts.and.returnValue(
      of([
        { ...mockContacts[1], priority: 1 },
        { ...mockContacts[0], priority: 2 },
      ])
    );
    component.moveContactUp(1);
    expect(fallAlertServiceSpy.reorderAlertContacts).toHaveBeenCalledWith({
      contact_ids: [9, 7],
    });

    // Send test email
    fallAlertServiceSpy.sendTestEmail.and.returnValue(
      of({ status: 'sent', contact_id: 7, sent_at: '2026-10-23T09:15:00Z' })
    );
    component.sendTestEmail(mockContacts[0]);
    expect(fallAlertServiceSpy.sendTestEmail).toHaveBeenCalledWith(7);
    expect(toastServiceSpy.success).toHaveBeenCalled();

    // Delete
    fallAlertServiceSpy.deleteAlertContact.and.returnValue(of(void 0));
    component.deleteContact(mockContacts[0]);
    expect(fallAlertServiceSpy.deleteAlertContact).toHaveBeenCalledWith(7);
  });
});
