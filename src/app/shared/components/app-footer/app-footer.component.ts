import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    LanguageSelectorComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './app-footer.component.html',
})
export class AppFooterComponent {
  readonly variant = input<'full' | 'compact'>('full');
  readonly currentYear = new Date().getFullYear();
}
