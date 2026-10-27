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
  readonly selectedUserId = model<string | number | null>(null);
  readonly selectedUserIds = model<(string | number)[]>([]);
  readonly multiple = input<boolean>(true);
  readonly allowAll = input<boolean>(true);
  readonly allLabel = input<string>('');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly size = input<'sm' | 'md'>('md');
  readonly fullWidth = input<boolean>(false);
  readonly customClass = input<string>('');
  readonly triggerId = input<string>('author-select-trigger');

  // Outputs
  readonly authorChange = output<StudioAuthorSummary | null>();
  readonly userIdsChange = output<(string | number)[]>();

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

  getAuthorKey(author: StudioAuthorSummary): string {
    return author.author_pseudonym || author.author_uuid || author.email;
  }

  isAuthorSelected(authorOrKey: StudioAuthorSummary | string | number): boolean {
    const key =
      typeof authorOrKey === 'object' && authorOrKey !== null
        ? this.getAuthorKey(authorOrKey)
        : String(authorOrKey);
    const author = typeof authorOrKey === 'object' && authorOrKey !== null ? authorOrKey : null;

    if (this.multiple()) {
      return this.selectedUserIds().some((id) => {
        const idStr = String(id);
        if (idStr === key) return true;
        if (author?.author_uuid && idStr === author.author_uuid) return true;
        if (author?.author_pseudonym && idStr === author.author_pseudonym) return true;
        return false;
      });
    }
    const current = this.selectedUserId();
    if (current === null) return false;
    const curStr = String(current);
    if (curStr === key) return true;
    if (author?.author_uuid && curStr === author.author_uuid) return true;
    if (author?.author_pseudonym && curStr === author.author_pseudonym) return true;
    return false;
  }

  readonly currentAuthor = computed<StudioAuthorSummary | null>(() => {
    const selected = this.selectedUserId();
    if (selected === null) return null;
    const str = String(selected);
    return (
      this.authors().find(
        (a) =>
          this.getAuthorKey(a) === str ||
          (a.author_uuid && a.author_uuid === str) ||
          (a.author_pseudonym && a.author_pseudonym === str) ||
          a.email === str
      ) ?? null
    );
  });

  readonly filteredAuthors = computed<StudioAuthorSummary[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.authors();
    if (!query) return list;
    return list.filter(
      (a) =>
        a.email.toLowerCase().includes(query) ||
        (a.name && a.name.toLowerCase().includes(query)) ||
        (a.author_pseudonym && a.author_pseudonym.toLowerCase().includes(query)) ||
        (a.author_uuid && a.author_uuid.toLowerCase().includes(query))
    );
  });

  readonly triggerSizeClasses = computed<string>(() => {
    return this.size() === 'sm'
      ? 'h-9 rounded-lg px-3 py-1.5 text-xs'
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
    const key = this.getAuthorKey(author);
    this.selectedUserId.set(key);
    this.authorChange.emit(author);
    this.closeDropdown();
  }

  toggleAuthor(author: StudioAuthorSummary): void {
    if (!this.multiple()) {
      this.selectAuthor(author);
      return;
    }
    const key = this.getAuthorKey(author);
    const current = this.selectedUserIds();
    const isSelected = this.isAuthorSelected(author);
    let updated: (string | number)[];
    if (isSelected) {
      updated = current.filter((id) => {
        const idStr = String(id);
        return (
          idStr !== key &&
          (!author.author_uuid || idStr !== author.author_uuid) &&
          (!author.author_pseudonym || idStr !== author.author_pseudonym)
        );
      });
    } else {
      updated = [...current, key];
    }
    this.selectedUserIds.set(updated);
    this.userIdsChange.emit(updated);
  }

  getAuthorDisplayName(author: StudioAuthorSummary): string {
    if (author.name) {
      return `${author.name} (${author.email})`;
    }
    if (author.author_pseudonym) {
      return `${author.author_pseudonym} (${author.email})`;
    }
    return author.email || (author.author_uuid ? `User ${author.author_uuid}` : 'User');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    }
  }
}
