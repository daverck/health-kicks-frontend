import { Component, inject, signal, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { SupportedLang } from '../../../core/i18n/i18n.models';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-selector.component.html',
})
export class LanguageSelectorComponent {
  readonly translation = inject(TranslationService);
  readonly compact = input<boolean>(false);
  readonly align = input<'left' | 'right' | 'center'>('right');

  readonly isOpen = signal<boolean>(false);

  readonly dropdownAlignmentClass = computed(() => {
    switch (this.align()) {
      case 'left':
        return 'left-0';
      case 'center':
        return 'left-1/2 -translate-x-1/2';
      case 'right':
      default:
        return 'right-0';
    }
  });

  toggleDropdown(): void {
    this.isOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  selectLanguage(code: SupportedLang): void {
    this.translation.setLanguage(code);
    this.closeDropdown();
  }
}
