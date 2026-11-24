import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AppFooterComponent } from '../../shared/components/app-footer/app-footer.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    LanguageSelectorComponent,
    ThemeToggleComponent,
    AppFooterComponent,
  ],
  templateUrl: './terms.component.html',
})
export class TermsComponent {}
