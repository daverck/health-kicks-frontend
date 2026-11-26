import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AppFooterComponent } from '../../shared/components/app-footer/app-footer.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    LanguageSelectorComponent,
    ThemeToggleComponent,
    AppFooterComponent,
  ],
  templateUrl: './support.component.html',
})
export class SupportComponent {
  readonly apiDocsUrl = `${environment.apiUrl}/docs`;
}
