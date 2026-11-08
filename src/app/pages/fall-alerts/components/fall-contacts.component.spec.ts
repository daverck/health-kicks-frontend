import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FallContactsComponent } from './fall-contacts.component';
import { AlertContactResponse } from '../../../models/api.models';

describe('FallContactsComponent', () => {
  let component: FallContactsComponent;
  let fixture: ComponentFixture<FallContactsComponent>;
  let fb: FormBuilder;

  const mockContacts: AlertContactResponse[] = [
    {
      id: 1,
      uuid: 'contact-uuid-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+33600000000',
      priority: 1,
      is_active: true,
      last_test_email_at: null,
    },
    {
      id: 2,
      uuid: 'contact-uuid-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: null,
      priority: 2,
      is_active: true,
      last_test_email_at: '2026-11-01T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FallContactsComponent, ReactiveFormsModule],
      providers: [FormBuilder],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
    fixture = TestBed.createComponent(FallContactsComponent);
    component = fixture.componentInstance;
    component.contacts = [...mockContacts];
    component.contactForm = fb.group({
      first_name: [''],
      last_name: [''],
      email: [''],
      phone: [''],
    });
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the list of contacts', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('[data-testid="contact-item"]');
    expect(items.length).toBe(2);
  });

  it('should emit editContact when onStartEdit is called', () => {
    spyOn(component.editContact, 'emit');
    component.onStartEdit(mockContacts[0]);
    expect(component.editContact.emit).toHaveBeenCalledWith(mockContacts[0]);
  });

  it('should emit deleteContact when onDelete is called', () => {
    spyOn(component.deleteContact, 'emit');
    component.onDelete(mockContacts[0]);
    expect(component.deleteContact.emit).toHaveBeenCalledWith(mockContacts[0]);
  });

  it('should emit moveContactUp when onMoveUp is called', () => {
    spyOn(component.moveContactUp, 'emit');
    component.onMoveUp(1);
    expect(component.moveContactUp.emit).toHaveBeenCalledWith(1);
  });

  it('should emit moveContactDown when onMoveDown is called', () => {
    spyOn(component.moveContactDown, 'emit');
    component.onMoveDown(0);
    expect(component.moveContactDown.emit).toHaveBeenCalledWith(0);
  });

  it('should emit sendTestEmail when onSendTest is called', () => {
    spyOn(component.sendTestEmail, 'emit');
    component.onSendTest(mockContacts[0]);
    expect(component.sendTestEmail.emit).toHaveBeenCalledWith(mockContacts[0]);
  });

  it('should emit submitContact when form is submitted', () => {
    spyOn(component.submitContact, 'emit');
    component.onSubmit();
    expect(component.submitContact.emit).toHaveBeenCalled();
  });
});
