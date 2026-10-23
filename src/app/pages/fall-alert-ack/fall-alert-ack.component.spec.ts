import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FallAlertAckComponent } from './fall-alert-ack.component';
import { FallAlertService } from '../../core/services/fall-alert.service';
import { FallAlertAckInfo, FallAlertAckResult } from '../../models/api.models';

describe('FallAlertAckComponent', () => {
  let component: FallAlertAckComponent;
  let fixture: ComponentFixture<FallAlertAckComponent>;
  let mockFallAlertService: jasmine.SpyObj<FallAlertService>;

  const sampleToken = 'valid-jwt-ack-token-abc123xyz';

  const mockInfoEscalating: FallAlertAckInfo = {
    alert_id: 10,
    patient_name: 'Jean Martin',
    contact_name: 'Marie Dupont',
    detected_at: '2026-10-23T15:30:00Z',
    detected_at_paris: '23/10/2026 à 17:30:00',
    event_type: 'fall_forward',
    event_type_label: "Chute vers l'avant",
    confidence_pct: 94,
    state: 'ESCALATING',
    lat: 48.8566,
    lon: 2.3522,
    accuracy_m: 12.0,
    maps_url: 'https://www.google.com/maps?q=48.856600,2.352200',
    already_acknowledged_by: null,
    cancel_reason: null,
  };

  const mockAckResult: FallAlertAckResult = {
    status: 'ok',
    state: 'ACKNOWLEDGED',
    alert_id: 10,
    acknowledged_by: 'Marie Dupont',
    message: 'Prise en charge confirmée par Marie Dupont.',
  };

  function setupTestBed(queryParamToken: string | null = sampleToken) {
    mockFallAlertService = jasmine.createSpyObj<FallAlertService>('FallAlertService', [
      'getAckInfo',
      'confirmAck',
    ]);

    TestBed.configureTestingModule({
      imports: [FallAlertAckComponent],
      providers: [
        { provide: FallAlertService, useValue: mockFallAlertService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? queryParamToken : null),
              },
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(FallAlertAckComponent);
    component = fixture.componentInstance;
  }

  it('should display error if no token is provided in query params', () => {
    setupTestBed(null);
    fixture.detectChanges();

    expect(component.viewState()).toBe('invalid_or_expired');
    expect(component.errorMessage()).toContain('Aucun jeton de prise en charge valide');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="ack-error"]')).toBeTruthy();
  });

  it('should load alert info and display pending confirmation state', () => {
    setupTestBed(sampleToken);
    mockFallAlertService.getAckInfo.and.returnValue(of(mockInfoEscalating));

    fixture.detectChanges();

    expect(mockFallAlertService.getAckInfo).toHaveBeenCalledWith(sampleToken);
    expect(component.viewState()).toBe('pending_confirmation');
    expect(component.ackInfo()?.patient_name).toBe('Jean Martin');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="ack-pending"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Jean Martin');
    expect(compiled.textContent).toContain('Marie Dupont');
    expect(compiled.textContent).toContain("Chute vers l'avant");
    expect(compiled.querySelector('[data-testid="maps-link"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="btn-confirm-ack"]')).toBeTruthy();
  });

  it('should transition to just_confirmed when user clicks confirmation button', () => {
    setupTestBed(sampleToken);
    mockFallAlertService.getAckInfo.and.returnValue(of(mockInfoEscalating));
    mockFallAlertService.confirmAck.and.returnValue(of(mockAckResult));

    fixture.detectChanges();

    component.onConfirmAck();
    fixture.detectChanges();

    expect(mockFallAlertService.confirmAck).toHaveBeenCalledWith(sampleToken);
    expect(component.viewState()).toBe('just_confirmed');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="ack-success"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Prise en charge confirmée');
  });

  it('should display already_acknowledged state if alert was already handled', () => {
    setupTestBed(sampleToken);
    const mockAlreadyAck: FallAlertAckInfo = {
      ...mockInfoEscalating,
      state: 'ACKNOWLEDGED',
      already_acknowledged_by: 'Paul Martin',
    };
    mockFallAlertService.getAckInfo.and.returnValue(of(mockAlreadyAck));

    fixture.detectChanges();

    expect(component.viewState()).toBe('already_acknowledged');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="ack-already"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Paul Martin');
    expect(compiled.textContent).toContain('Alerte déjà prise en charge');
  });

  it('should display cancelled state if patient cancelled alert', () => {
    setupTestBed(sampleToken);
    const mockCancelled: FallAlertAckInfo = {
      ...mockInfoEscalating,
      state: 'CANCELLED',
      cancel_reason: 'user_cancel',
    };
    mockFallAlertService.getAckInfo.and.returnValue(of(mockCancelled));

    fixture.detectChanges();

    expect(component.viewState()).toBe('cancelled');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="ack-cancelled"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Alerte annulée par le patient');
  });

  it('should display expired state if token has expired', () => {
    setupTestBed(sampleToken);
    mockFallAlertService.getAckInfo.and.returnValue(
      throwError(() => ({
        error: { detail: 'Ce lien de prise en charge a expiré (validité maximale : 2 heures).' },
      }))
    );

    fixture.detectChanges();

    expect(component.viewState()).toBe('invalid_or_expired');
    expect(component.isExpired()).toBeTrue();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="ack-error"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Lien de prise en charge expiré');
    expect(compiled.querySelector('[data-testid="btn-call-112"]')).toBeTruthy();
  });
});

