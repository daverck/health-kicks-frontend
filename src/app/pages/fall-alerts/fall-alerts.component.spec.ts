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
    uuid: '00000000-0000-0000-0000-000000000003',
    pseudonym: 'SUBJ-ADM-0003',
    email: 'admin@example.com',
    name: 'Admin Clinician',
    role: 'admin',
    is_active: true,
  };

  const mockAlertSummary: FallAlertSummary = {
    id: 42,
    uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    event_id: '0b6f4b1e-6a51-4c1f-9a3e-2d7f1c9b8e10',
    user_id: 3,
    user_uuid: '11111111-2222-3333-4444-555555555555',
    user_pseudonym: 'SUBJ-A8F19C2D',
    user_display_name: 'Patient SUBJ-A8F19C2D',
    subject_pseudonym: 'SUBJ-A8F19C2D',
    is_pseudonymized: true,
    device_id: 'HK-1',
    event_type: 'fall_forward',
    confidence: 0.91,
    state: 'ACKNOWLEDGED',
    cancel_reason: null,
    delivery: 'live',
    has_location: true,
    location: {
      lat: 50.8466,
      lon: 4.3528,
      accuracy_m: 12.5,
      captured_at: '2026-10-23T08:39:01Z',
    },
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
        channel: 'email',
        contact_first_name: 'Marie',
        contact_last_name: 'Dupont',
        contact_email: 'marie.dupont@example.com',
        contact_phone: '+32470123456',
        status: 'SENT',
        sent_at: '2026-10-23T08:40:04Z',
        acknowledged_at: null,
        error_message: null,
      },
      {
        id: 103,
        rank: 1,
        channel: 'sms',
        contact_first_name: 'Marie',
        contact_last_name: 'Dupont',
        contact_email: 'marie.dupont@example.com',
        contact_phone: '+32470123456',
        status: 'PENDING_SMS',
        sent_at: '2026-10-23T08:40:04Z',
        acknowledged_at: null,
        error_message: null,
      },
      {
        id: 102,
        rank: 2,
        channel: 'email',
        contact_first_name: 'Paul',
        contact_last_name: 'Martin',
        contact_email: 'paul.martin@example.com',
        contact_phone: null,
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
      uuid: '77777777-8888-9999-aaaa-bbbbbbbbbbbb',
      user_uuid: '11111111-2222-3333-4444-555555555555',
      user_pseudonym: 'SUBJ-A8F19C2D',
      first_name: 'Marie',
      last_name: 'Dupont',
      email: 'marie.dupont@example.com',
      phone: '+32470123456',
      priority: 1,
      last_test_email_at: null,
      created_at: '2026-10-23T08:00:00Z',
      updated_at: '2026-10-23T08:00:00Z',
    },
    {
      id: 9,
      uuid: '99999999-8888-7777-6666-555555555555',
      user_uuid: '11111111-2222-3333-4444-555555555555',
      user_pseudonym: 'SUBJ-A8F19C2D',
      first_name: 'Paul',
      last_name: 'Martin',
      email: 'paul.martin@example.com',
      phone: null,
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

  it('should display the subject pseudonym in the table and modal without numeric user ID or plain name', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // Check table row displays pseudonym
    const patientCell = compiled.querySelector('tbody tr td:nth-child(2)');
    expect(patientCell?.textContent?.trim()).toContain('SUBJ-A8F19C2D');
    expect(patientCell?.textContent).not.toContain('(#3)');

    // Open modal
    component.openAlertDetail('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    fixture.detectChanges();

    const modal = compiled.querySelector('[data-testid="alert-detail-modal"]');
    expect(modal).toBeTruthy();
    expect(modal?.textContent).toContain('SUBJ-A8F19C2D');
    expect(modal?.textContent).not.toContain('(#3)');
  });

  it('should filter alerts by pseudonym and trigger fallAlertService with pseudonym query', () => {
    component.onPseudonymFilterChange('SUBJ-A8F19C2D');
    expect(component.pseudonymFilter()).toBe('SUBJ-A8F19C2D');
    expect(fallAlertServiceSpy.listFallAlerts).toHaveBeenCalledWith(
      jasmine.objectContaining({ pseudonym: 'SUBJ-A8F19C2D', page: 1 })
    );

    // Verify 36px/h-9 input is present in the table header
    const input: HTMLInputElement | null = fixture.nativeElement.querySelector('[data-testid="admin-pseudonym-filter"]');
    expect(input).toBeTruthy();
    expect(input?.classList.contains('h-9')).toBeTrue();
  });

  it('should filter alerts by state and open detail modal with email/SMS notification timeline', () => {
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

    const timelineItems: NodeListOf<HTMLElement> = modal.querySelectorAll(
      '[data-testid="notification-timeline-item"]'
    );
    expect(timelineItems.length).toBe(3);

    const channelBadges: NodeListOf<HTMLElement> = modal.querySelectorAll(
      '[data-testid="notification-channel-badge"]'
    );
    expect(channelBadges[0].textContent?.trim()).toBe('Email');
    expect(channelBadges[1].textContent?.trim()).toBe('SMS');

    // SMS entry shows the phone number instead of the email address
    expect(timelineItems[1].textContent).toContain('+32470123456');
    expect(timelineItems[1].textContent).not.toContain('(marie.dupont@example.com)');
    expect(timelineItems[0].textContent).toContain('(marie.dupont@example.com)');

    expect(component.getNotificationStatusBadgeClass('PENDING_SMS')).toContain('amber');

    component.closeAlertDetail();
    expect(component.selectedAlertDetail()).toBeNull();
  });

  it('should render a direct Google Maps link in the alerts table and open google maps without opening detail modal', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const gpsLink = compiled.querySelector('[data-testid="alert-google-maps-link"]') as HTMLAnchorElement;

    expect(gpsLink).toBeTruthy();
    expect(gpsLink.tagName.toLowerCase()).toBe('a');
    expect(gpsLink.getAttribute('href')).toBe('https://www.google.com/maps?q=50.8466,4.3528');
    expect(gpsLink.getAttribute('target')).toBe('_blank');

    const openModalSpy = spyOn(component, 'openAlertDetail');
    gpsLink.click();
    expect(openModalSpy).not.toHaveBeenCalled();
    expect(component.selectedAlertDetail()).toBeNull();
  });

  it('should support openGoogleMapsForAlert fallback when location is not yet present on summary', () => {
    const windowOpenSpy = spyOn(window, 'open');
    const alertWithoutLoc: FallAlertSummary = {
      ...mockAlertSummary,
      location: null,
    };

    fallAlertServiceSpy.getFallAlertDetail.and.returnValue(of(mockAlertDetail));

    component.openGoogleMapsForAlert(alertWithoutLoc);

    expect(fallAlertServiceSpy.getFallAlertDetail).toHaveBeenCalledWith('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(windowOpenSpy).toHaveBeenCalledWith('https://www.google.com/maps?q=50.8466,4.3528', '_blank', 'noopener,noreferrer');
  });

  it('should display phone and SMS/email-only badges in the contacts list', () => {
    component.setTab('contacts');
    fixture.detectChanges();

    const phones = fixture.nativeElement.querySelectorAll('[data-testid="contact-phone"]');
    expect(phones.length).toBe(1);
    expect(phones[0].textContent).toContain('+32470123456');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="sms-enabled-badge"]').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="email-only-badge"]').length).toBe(1);
    expect(fixture.nativeElement.querySelector('[data-testid="contact-phone-input"]')).toBeTruthy();
  });

  it('should switch to contacts tab and add a new emergency contact with a phone number', () => {
    component.setTab('contacts');
    fixture.detectChanges();

    expect(component.activeTab()).toBe('contacts');
    const banner = fixture.nativeElement.querySelector('[data-testid="contacts-info-banner"]');
    expect(banner?.textContent).toContain('Surveillance Active');

    fallAlertServiceSpy.addAlertContact.and.returnValue(
      of({
        id: 12,
        uuid: '12121212-3434-5656-7878-909090909090',
        first_name: 'Claire',
        last_name: 'Bernard',
        email: 'claire.bernard@example.com',
        phone: '+32470999888',
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
      phone: ' +32 470 99 98 88 ',
    });
    component.onSubmitContact();

    expect(fallAlertServiceSpy.addAlertContact).toHaveBeenCalledWith({
      first_name: 'Claire',
      last_name: 'Bernard',
      email: 'claire.bernard@example.com',
      phone: '+32 470 99 98 88',
    });
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });

  it('should send phone as null when the phone field is left empty', () => {
    fallAlertServiceSpy.addAlertContact.and.returnValue(of(mockContacts[1]));
    component.contactForm.setValue({
      first_name: 'Paul',
      last_name: 'Martin',
      email: 'paul.martin@example.com',
      phone: '   ',
    });
    component.onSubmitContact();

    expect(fallAlertServiceSpy.addAlertContact).toHaveBeenCalledWith(
      jasmine.objectContaining({ phone: null })
    );
  });

  it('should reject an invalid phone number in the form', () => {
    component.contactForm.controls.phone.setValue('abc');
    expect(component.contactForm.controls.phone.invalid).toBeTrue();
    component.contactForm.controls.phone.setValue('+32 (470) 12-34.56');
    expect(component.contactForm.controls.phone.valid).toBeTrue();
  });

  it('should edit (clearing the phone), reorder, send test email, and delete an emergency contact', () => {
    component.setTab('contacts');
    fixture.detectChanges();

    // Edit
    component.startEditContact(mockContacts[0]);
    expect(component.editingContact()).toEqual(mockContacts[0]);
    expect(component.contactForm.controls.phone.value).toBe('+32470123456');
    component.contactForm.patchValue({ last_name: 'Dupont-Martin', phone: '' });
    fallAlertServiceSpy.updateAlertContact.and.returnValue(
      of({ ...mockContacts[0], last_name: 'Dupont-Martin', phone: null })
    );
    component.onSubmitContact();
    expect(fallAlertServiceSpy.updateAlertContact).toHaveBeenCalledWith('77777777-8888-9999-aaaa-bbbbbbbbbbbb', {
      first_name: 'Marie',
      last_name: 'Dupont-Martin',
      email: 'marie.dupont@example.com',
      phone: null,
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

    // Send test email (email only)
    fallAlertServiceSpy.sendTestEmail.and.returnValue(
      of({ status: 'sent', contact_id: 9, sent_at: '2026-10-23T09:15:00Z', sms_dispatched: false })
    );
    component.sendTestEmail(mockContacts[1]);
    expect(fallAlertServiceSpy.sendTestEmail).toHaveBeenCalledWith('99999999-8888-7777-6666-555555555555');
    expect(toastServiceSpy.success).toHaveBeenCalledWith(
      jasmine.stringMatching('paul.martin@example.com')
    );

    // Delete
    fallAlertServiceSpy.deleteAlertContact.and.returnValue(of(void 0));
    component.deleteContact(mockContacts[0]);
    expect(fallAlertServiceSpy.deleteAlertContact).toHaveBeenCalledWith('77777777-8888-9999-aaaa-bbbbbbbbbbbb');
  });

  it('should show the email + SMS toast when the test SMS was dispatched', () => {
    fallAlertServiceSpy.sendTestEmail.and.returnValue(
      of({ status: 'sent', contact_id: 7, sent_at: '2026-10-23T09:15:00Z', sms_dispatched: true })
    );
    component.sendTestEmail(mockContacts[0]);

    expect(toastServiceSpy.success).toHaveBeenCalledWith(jasmine.stringMatching('SMS'));
    expect(toastServiceSpy.success).toHaveBeenCalledWith(jasmine.stringMatching('Marie'));
    expect(component.contacts().find((c) => c.id === 7)?.last_test_email_at).toBe(
      '2026-10-23T09:15:00Z'
    );
  });
});
