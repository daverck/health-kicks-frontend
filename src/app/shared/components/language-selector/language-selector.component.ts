import { Component, inject, signal, input } from '@angular/core';
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

  readonly isOpen = signal<boolean>(false);

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
