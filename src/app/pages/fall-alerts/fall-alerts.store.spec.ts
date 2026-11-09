import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FallAlertsStore } from './fall-alerts.store';
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

describe('FallAlertsStore', () => {
  let store: FallAlertsStore;
  let fallAlertServiceSpy: {
    listFallAlerts: ReturnType<typeof vi.fn>;
    getFallAlertDetail: ReturnType<typeof vi.fn>;
    listAlertContacts: ReturnType<typeof vi.fn>;
    addAlertContact: ReturnType<typeof vi.fn>;
    updateAlertContact: ReturnType<typeof vi.fn>;
    deleteAlertContact: ReturnType<typeof vi.fn>;
    reorderAlertContacts: ReturnType<typeof vi.fn>;
    sendTestEmail: ReturnType<typeof vi.fn>;
  };
  let toastServiceSpy: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };
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
    detected_at: '2026-10-23T08:39:03Z',
    escalation_started_at: '2026-10-23T08:40:03Z',
    closed_at: '2026-10-23T08:44:51Z',
    acknowledged_by: { first_name: 'Paul', last_name: 'Martin' },
    notified_contacts_count: 2,
  };

  const mockPaginatedAlerts: PaginatedFallAlertsResponse = {
    items: [mockAlertSummary],
    total: 1,
    page: 1,
    page_size: 20,
    has_more: false,
  };

  const mockContacts: AlertContactResponse[] = [
    {
      id: 1,
      uuid: 'c1-uuid',
      user_id: 3,
      priority: 1,
      first_name: 'Marie',
      last_name: 'Curie',
      email: 'marie@example.com',
      phone: '+33123456789',
      notify_email: true,
      notify_sms: true,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 2,
      uuid: 'c2-uuid',
      user_id: 3,
      priority: 2,
      first_name: 'Pierre',
      last_name: 'Curie',
      email: 'pierre@example.com',
      phone: null,
      notify_email: true,
      notify_sms: false,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    userSignal = signal<UserResponse | null>(mockUser);

    fallAlertServiceSpy = {
      listFallAlerts: vi.fn().mockReturnValue(of(mockPaginatedAlerts)),
      getFallAlertDetail: vi.fn().mockReturnValue(of({ ...mockAlertSummary, notifications: [] } as FallAlertDetail)),
      listAlertContacts: vi.fn().mockReturnValue(of(mockContacts)),
      addAlertContact: vi.fn().mockReturnValue(of(mockContacts[0])),
      updateAlertContact: vi.fn().mockReturnValue(of(mockContacts[0])),
      deleteAlertContact: vi.fn().mockReturnValue(of({ success: true })),
      reorderAlertContacts: vi.fn().mockReturnValue(of(mockContacts)),
      sendTestEmail: vi.fn().mockReturnValue(of({ success: true, sent_at: '2026-10-23T10:00:00Z', sms_dispatched: false })),
    };

    toastServiceSpy = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FallAlertsStore,
        { provide: FallAlertService, useValue: fallAlertServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        {
          provide: AuthService,
          useValue: {
            currentUser: userSignal,
            user: userSignal,
          },
        },
      ],
    });

    store = TestBed.inject(FallAlertsStore);
  });

  it('should initialize with default states and compute role permissions', () => {
    expect(store.activeTab()).toBe('history');
    expect(store.isAdmin()).toBe(true);
    expect(store.isClinicianOrAdmin()).toBe(true);
    expect(store.selectedState()).toBe('all');
    expect(store.page()).toBe(1);
  });

  it('should load alerts and update pagination signals', () => {
    store.loadAlerts();

    expect(fallAlertServiceSpy.listFallAlerts).toHaveBeenCalled();
    expect(store.loadingAlerts()).toBe(false);
    expect(store.alerts()).toEqual([mockAlertSummary]);
    expect(store.total()).toBe(1);
    expect(store.totalPages()).toBe(1);
  });

  it('should handle error when loading alerts fails', () => {
    fallAlertServiceSpy.listFallAlerts.mockReturnValue(throwError(() => new Error('Network error')));

    store.loadAlerts();

    expect(store.loadingAlerts()).toBe(false);
    expect(store.alertsError()).toBe(true);
    expect(store.alerts()).toEqual([]);
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });

  it('should load emergency contacts and sort by priority', () => {
    store.loadContacts();

    expect(fallAlertServiceSpy.listAlertContacts).toHaveBeenCalled();
    expect(store.contacts().length).toBe(2);
    expect(store.contacts()[0].priority).toBe(1);
    expect(store.contacts()[1].priority).toBe(2);
  });

  it('should switch tabs and refresh active tab data', () => {
    store.setTab('contacts');
    expect(store.activeTab()).toBe('contacts');
    expect(fallAlertServiceSpy.listAlertContacts).toHaveBeenCalled();

    store.refresh();
    expect(fallAlertServiceSpy.listAlertContacts).toHaveBeenCalledTimes(2);

    store.setTab('history');
    expect(store.activeTab()).toBe('history');
    expect(fallAlertServiceSpy.listFallAlerts).toHaveBeenCalled();
  });

  it('should open and close alert details', () => {
    store.openAlertDetail(42);

    expect(fallAlertServiceSpy.getFallAlertDetail).toHaveBeenCalledWith(42);
    expect(store.selectedAlertDetail()).toBeTruthy();

    store.closeAlertDetail();
    expect(store.selectedAlertDetail()).toBeNull();
  });

  it('should delete a contact and refresh contacts list', () => {
    store.loadContacts();
    store.deleteContact(mockContacts[0]);

    expect(fallAlertServiceSpy.deleteAlertContact).toHaveBeenCalledWith('c1-uuid');
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });
});
