import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioAuthorSummary } from '../../../models/studio-history.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-author-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './author-select.component.html',
})
export class AuthorSelectComponent {
  private readonly elementRef = inject(ElementRef);

  // Inputs & Two-way models
  readonly authors = input<StudioAuthorSummary[]>([]);
  readonly selectedUserId = model<number | null>(null);
  readonly selectedUserIds = model<number[]>([]);
  readonly multiple = input<boolean>(true);
  readonly allowAll = input<boolean>(true);
  readonly allLabel = input<string>('');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly size = input<'sm' | 'md'>('md');
  readonly fullWidth = input<boolean>(false);
  readonly triggerId = input<string>('author-select-trigger');

  // Outputs
  readonly authorChange = output<StudioAuthorSummary | null>();
  readonly userIdsChange = output<number[]>();

  // Internal state
  readonly isOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  readonly isAllSelected = computed<boolean>(() => {
    if (this.multiple()) {
      return this.selectedUserIds().length === 0;
    }
    return this.allowAll() && this.selectedUserId() === null;
  });

  readonly selectedCount = computed<number>(() => {
    if (!this.multiple()) {
      return this.selectedUserId() !== null ? 1 : 0;
    }
    return this.selectedUserIds().length;
  });

  isAuthorSelected(id: number): boolean {
    if (this.multiple()) {
      return this.selectedUserIds().includes(id);
    }
    return this.selectedUserId() === id;
  }

  readonly currentAuthor = computed<StudioAuthorSummary | null>(() => {
    const id = this.selectedUserId();
    if (id === null) return null;
    return this.authors().find((a) => a.id === id) ?? null;
  });

  readonly filteredAuthors = computed<StudioAuthorSummary[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.authors();
    if (!query) return list;
    return list.filter(
      (a) =>
        a.email.toLowerCase().includes(query) ||
        (a.name && a.name.toLowerCase().includes(query)) ||
        String(a.id).includes(query)
    );
  });

  readonly triggerSizeClasses = computed<string>(() => {
    return this.size() === 'sm'
      ? 'rounded-lg px-3 py-1.5 text-xs'
      : 'rounded-xl px-4 py-2.5 text-sm';
  });

  toggleDropdown(): void {
    if (this.disabled()) return;
    this.isOpen.update((open) => !open);
    if (!this.isOpen()) {
      this.searchQuery.set('');
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  selectAll(): void {
    if (this.multiple()) {
      this.selectedUserIds.set([]);
      this.userIdsChange.emit([]);
      return;
    }
    if (!this.allowAll()) return;
    this.selectedUserId.set(null);
    this.authorChange.emit(null);
    this.closeDropdown();
  }

  selectAuthor(author: StudioAuthorSummary): void {
    this.selectedUserId.set(author.id);
    this.authorChange.emit(author);
    this.closeDropdown();
  }

  toggleAuthor(author: StudioAuthorSummary): void {
    if (!this.multiple()) {
      this.selectAuthor(author);
      return;
    }
    const current = this.selectedUserIds();
    const index = current.indexOf(author.id);
    let updated: number[];
    if (index >= 0) {
      updated = current.filter((id) => id !== author.id);
    } else {
      updated = [...current, author.id];
    }
    this.selectedUserIds.set(updated);
    this.userIdsChange.emit(updated);
  }

  getAuthorDisplayName(author: StudioAuthorSummary): string {
    if (author.name) {
      return `${author.name} (${author.email})`;
    }
    return author.email || `User #${author.id}`;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    }
  }
}

