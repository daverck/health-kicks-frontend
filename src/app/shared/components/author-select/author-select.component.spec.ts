import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { AuthorSelectComponent } from './author-select.component';
import { StudioAuthorSummary } from '../../../models/studio-history.model';

const mockAuthors: StudioAuthorSummary[] = [
  {
    author_uuid: '11111111-1111-1111-1111-111111111111',
    author_pseudonym: 'HK-ALICE',
    email: 'alice@example.com',
    name: 'Dr. Alice',
    is_pseudonymized: false,
  },
  {
    author_uuid: '22222222-2222-2222-2222-222222222222',
    author_pseudonym: 'HK-BOB',
    email: 'bob@example.com',
    name: 'Dr. Bob',
    is_pseudonymized: false,
  },
  {
    author_uuid: '33333333-3333-3333-3333-333333333333',
    author_pseudonym: 'HK-CHARLIE',
    email: 'charlie@example.com',
    name: null,
    is_pseudonymized: false,
  },
];

@Component({
  standalone: true,
  imports: [AuthorSelectComponent],
  template: `
    <app-author-select
      [authors]="authors()"
      [(selectedUserId)]="selectedUserId"
      [(selectedUserIds)]="selectedUserIds"
      [multiple]="multiple()"
      [allowAll]="allowAll()"
      [disabled]="disabled()"
      [size]="size()"
      [fullWidth]="fullWidth()"
      (authorChange)="lastAuthorChange = $event"
      (userIdsChange)="lastUserIdsChange = $event"
    />
  `,
})
class HostComponent {
  readonly authors = signal<StudioAuthorSummary[]>(mockAuthors);
  readonly selectedUserId = signal<string | number | null>(null);
  readonly selectedUserIds = signal<(string | number)[]>([]);
  readonly multiple = signal<boolean>(true);
  readonly allowAll = signal<boolean>(true);
  readonly disabled = signal<boolean>(false);
  readonly size = signal<'sm' | 'md'>('md');
  readonly fullWidth = signal<boolean>(false);

  lastAuthorChange: StudioAuthorSummary | null = null;
  lastUserIdsChange: (string | number)[] = [];
}

describe('AuthorSelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: AuthorSelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, AuthorSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  });

  it('should render trigger button with All option selected by default in multiple mode', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#author-select-trigger');
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toContain('Tous les auteurs');
    expect(component.isOpen()).toBeFalse();
  });

  it('should toggle dropdown open and closed on trigger click', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#author-select-trigger');
    trigger.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBeTrue();

    let dropdown = fixture.nativeElement.querySelector('[data-testid="author-select-dropdown"]');
    expect(dropdown).toBeTruthy();

    trigger.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBeFalse();
    dropdown = fixture.nativeElement.querySelector('[data-testid="author-select-dropdown"]');
    expect(dropdown).toBeNull();
  });

  it('should filter authors by search query', () => {
    component.toggleDropdown();
    fixture.detectChanges();

    expect(component.filteredAuthors().length).toBe(3);

    component.searchQuery.set('Bob');
    fixture.detectChanges();
    expect(component.filteredAuthors().length).toBe(1);
    expect(component.filteredAuthors()[0].author_pseudonym).toBe('HK-BOB');

    component.searchQuery.set('xyz');
    fixture.detectChanges();
    expect(component.filteredAuthors().length).toBe(0);
  });

  it('should toggle authors in multiple mode and emit userIdsChange', () => {
    component.toggleDropdown();
    fixture.detectChanges();

    const opt1: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="author-option-HK-ALICE"]');
    opt1.click();
    fixture.detectChanges();

    expect(host.selectedUserIds()).toEqual(['HK-ALICE']);
    expect(host.lastUserIdsChange).toEqual(['HK-ALICE']);
    expect(component.selectedCount()).toBe(1);

    const opt2: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="author-option-HK-BOB"]');
    opt2.click();
    fixture.detectChanges();

    expect(host.selectedUserIds()).toEqual(['HK-ALICE', 'HK-BOB']);
    expect(component.selectedCount()).toBe(2);

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('#author-select-trigger');
    expect(trigger.textContent).toContain('2');

    // Uncheck opt1
    opt1.click();
    fixture.detectChanges();

    expect(host.selectedUserIds()).toEqual(['HK-BOB']);
    expect(component.selectedCount()).toBe(1);
  });

  it('should reset to all when selectAll() is clicked in multiple mode', () => {
    host.selectedUserIds.set(['HK-ALICE', 'HK-BOB']);
    fixture.detectChanges();
    expect(component.isAllSelected()).toBeFalse();

    component.toggleDropdown();
    fixture.detectChanges();

    const allOption: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="author-option-all"]');
    allOption.click();
    fixture.detectChanges();

    expect(host.selectedUserIds()).toEqual([]);
    expect(host.lastUserIdsChange).toEqual([]);
    expect(component.isAllSelected()).toBeTrue();
  });

  it('should support single-select mode when multiple is false', () => {
    host.multiple.set(false);
    fixture.detectChanges();

    component.toggleDropdown();
    fixture.detectChanges();

    const opt1: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="author-option-HK-ALICE"]');
    opt1.click();
    fixture.detectChanges();

    expect(host.selectedUserId()).toBe('HK-ALICE');
    expect(host.lastAuthorChange?.author_pseudonym).toBe('HK-ALICE');
    expect(component.isOpen()).toBeFalse();
  });
});
