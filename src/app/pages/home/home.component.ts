import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

export type SimulationMode = 'walk' | 'fall' | 'haptic' | 'idle';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LanguageSelectorComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly translationService = inject(TranslationService);

  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly currentLang = this.translationService.currentLang;
  readonly showWordplay = computed(() => this.currentLang() !== 'en');
  readonly currentYear = new Date().getFullYear();

  readonly activeSimulation = signal<SimulationMode>('walk');

  readonly steps = [
    { titleKey: 'home.how_step_1_title', descKey: 'home.how_step_1_desc' },
    { titleKey: 'home.how_step_2_title', descKey: 'home.how_step_2_desc' },
    { titleKey: 'home.how_step_3_title', descKey: 'home.how_step_3_desc' },
    { titleKey: 'home.how_step_4_title', descKey: 'home.how_step_4_desc' },
  ];

  setSimulation(mode: SimulationMode): void {
    this.activeSimulation.set(mode);
  }
}
