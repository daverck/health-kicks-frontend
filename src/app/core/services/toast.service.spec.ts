import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created with empty toasts list', () => {
    expect(service).toBeTruthy();
    expect(service.toasts()).toEqual([]);
  });

  it('should add a toast and automatically dismiss after duration', fakeAsync(() => {
    service.show('Test message', 'info', 3000);

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Test message');
    expect(service.toasts()[0].type).toBe('info');

    tick(3000);
    expect(service.toasts().length).toBe(0);
  }));

  it('should handle success() and error() helper methods', fakeAsync(() => {
    service.success('Operation succeeded');
    service.error('An error occurred');

    expect(service.toasts().length).toBe(2);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[1].type).toBe('error');

    // success auto dismisses at 4000ms
    tick(4000);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('error');

    // error auto dismisses at 6000ms (remaining 2000ms)
    tick(2000);
    expect(service.toasts().length).toBe(0);
  }));

  it('should allow manually dismissing a toast by id', () => {
    service.info('Message 1');
    service.info('Message 2');

    const firstId = service.toasts()[0].id;
    service.dismiss(firstId);

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Message 2');
  });
});

