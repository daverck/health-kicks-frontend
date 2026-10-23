import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FallAlertService } from './fall-alert.service';
import { environment } from '../../../environments/environment';
import {
  AlertContactResponse,
  FallAlertDetail,
  PaginatedFallAlertsResponse,
} from '../../models/api.models';

describe('FallAlertService', () => {
  let service: FallAlertService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api/v1`;

  const mockContact: AlertContactResponse = {
    id: 7,
    first_name: 'Marie',
    last_name: 'Dupont',
    email: 'marie.dupont@example.com',
    priority: 1,
    last_test_email_at: null,
    created_at: '2026-10-23T08:00:00Z',
    updated_at: '2026-10-23T08:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), FallAlertService],
    });
    service = TestBed.inject(FallAlertService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list emergency contacts via GET /users/me/alert-contacts', () => {
    service.listAlertContacts().subscribe((contacts) => {
      expect(contacts).toEqual([mockContact]);
    });

    const req = httpMock.expectOne(`${base}/users/me/alert-contacts`);
    expect(req.request.method).toBe('GET');
    req.flush([mockContact]);
  });

  it('should add an emergency contact via POST /users/me/alert-contacts', () => {
    const payload = {
      first_name: 'Marie',
      last_name: 'Dupont',
      email: 'marie.dupont@example.com',
    };

    service.addAlertContact(payload).subscribe((created) => {
      expect(created).toEqual(mockContact);
    });

    const req = httpMock.expectOne(`${base}/users/me/alert-contacts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockContact);
  });

  it('should reorder emergency contacts via PUT /users/me/alert-contacts/order', () => {
    service.reorderAlertContacts([9, 7]).subscribe((reordered) => {
      expect(reordered.length).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/users/me/alert-contacts/order`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ contact_ids: [9, 7] });
    req.flush([mockContact]);
  });

  it('should update an emergency contact via PATCH /users/me/alert-contacts/{id}', () => {
    const updatePayload = { last_name: 'Dupont-Martin' };

    service.updateAlertContact(7, updatePayload).subscribe((updated) => {
      expect(updated.last_name).toBe('Dupont-Martin');
    });

    const req = httpMock.expectOne(`${base}/users/me/alert-contacts/7`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updatePayload);
    req.flush({ ...mockContact, last_name: 'Dupont-Martin' });
  });

  it('should delete an emergency contact via DELETE /users/me/alert-contacts/{id}', () => {
    service.deleteAlertContact(7).subscribe();

    const req = httpMock.expectOne(`${base}/users/me/alert-contacts/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should send a test email via POST /users/me/alert-contacts/{id}/test-email', () => {
    const mockRes = { status: 'sent', contact_id: 7, sent_at: '2026-10-23T08:10:00Z' };

    service.sendTestEmail(7).subscribe((res) => {
      expect(res).toEqual(mockRes);
    });

    const req = httpMock.expectOne(`${base}/users/me/alert-contacts/7/test-email`);
    expect(req.request.method).toBe('POST');
    req.flush(mockRes);
  });

  it('should list fall alerts with filters via GET /fall-alerts', () => {
    const mockPage: PaginatedFallAlertsResponse = {
      items: [],
      total: 0,
      page: 2,
      page_size: 20,
    };

    service
      .listFallAlerts({
        page: 2,
        pageSize: 20,
        state: 'ACKNOWLEDGED',
        startDate: '2026-10-01',
        endDate: '2026-10-23',
        userId: 3,
      })
      .subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${base}/fall-alerts` &&
        r.params.get('page') === '2' &&
        r.params.get('page_size') === '20' &&
        r.params.get('state') === 'ACKNOWLEDGED' &&
        r.params.get('start_date') === '2026-10-01' &&
        r.params.get('end_date') === '2026-10-23' &&
        r.params.get('user_id') === '3'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should fetch fall alert detail via GET /fall-alerts/{id}', () => {
    const mockDetail: FallAlertDetail = {
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
      location: {
        lat: 50.8466,
        lon: 4.3528,
        accuracy_m: 12.5,
        captured_at: '2026-10-23T08:39:01Z',
      },
      notifications: [],
    };

    service.getFallAlertDetail(42).subscribe((detail) => {
      expect(detail).toEqual(mockDetail);
    });

    const req = httpMock.expectOne(`${base}/fall-alerts/42`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDetail);
  });
});
