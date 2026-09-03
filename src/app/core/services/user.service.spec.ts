import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';
import { mockUser } from '../../../testing/mocks/auth.mock';

describe('UserService', () => {
  let service: UserService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch me profile via GET /auth/me', () => {
    service.me().subscribe((user) => {
      expect(user).toEqual(mockUser);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should update user via PATCH /users/{id}', () => {
    const updated = { ...mockUser, is_active: false };
    service.updateUser(1, { is_active: false }).subscribe((user) => {
      expect(user.is_active).toBeFalse();
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/users/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ is_active: false });
    req.flush(updated);
  });

  it('should update profile via updateProfile()', () => {
    const updated = { ...mockUser, name: 'Nom Modifié' };
    service.updateProfile(1, { name: 'Nom Modifié' }).subscribe((user) => {
      expect(user.name).toBe('Nom Modifié');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/v1/users/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Nom Modifié' });
    req.flush(updated);
  });
});

