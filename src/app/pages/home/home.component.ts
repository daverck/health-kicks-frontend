import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

export type SimulationMode = 'walk' | 'fall' | 'haptic' | 'idle';
export type HeroVisualMode = 'shoe' | 'web' | 'mobile';

export interface ScreenshotItem {
  titleKey: string;
  descKey: string;
  imageSrc: string;
  tag: string;
}

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
  readonly heroVisualMode = signal<HeroVisualMode>('shoe');

  // Showcase interactive state
  readonly activeAppTab = signal<'web' | 'mobile'>('web');
  readonly selectedWebScreenshot = signal(0);
  readonly selectedMobileScreenshot = signal(0);

  readonly webScreenshots: ScreenshotItem[] = [
    {
      titleKey: 'home.showcase_web_1_title',
      descKey: 'home.showcase_web_1_desc',
      imageSrc: '/images/screenshots/web-studio-telemetry.jpg',
      tag: 'Studio IMU',
    },
    {
      titleKey: 'home.showcase_web_2_title',
      descKey: 'home.showcase_web_2_desc',
      imageSrc: '/images/screenshots/web-steps-history.jpg',
      tag: 'Podomètre',
    },
    {
      titleKey: 'home.showcase_web_3_title',
      descKey: 'home.showcase_web_3_desc',
      imageSrc: '/images/screenshots/web-activity-history.jpg',
      tag: 'Détections',
    },
  ];

  readonly mobileScreenshots: ScreenshotItem[] = [
    {
      titleKey: 'home.showcase_mobile_1_title',
      descKey: 'home.showcase_mobile_1_desc',
      imageSrc: '/images/screenshots/mobile-dashboard.jpg',
      tag: 'Dashboard',
    },
    {
      titleKey: 'home.showcase_mobile_2_title',
      descKey: 'home.showcase_mobile_2_desc',
      imageSrc: '/images/screenshots/mobile-steps-history.jpg',
      tag: 'Historique',
    },
    {
      titleKey: 'home.showcase_mobile_3_title',
      descKey: 'home.showcase_mobile_3_desc',
      imageSrc: '/images/screenshots/mobile-event-logs.jpg',
      tag: 'Logs BLE',
    },
  ];

  readonly steps = [
    { titleKey: 'home.how_step_1_title', descKey: 'home.how_step_1_desc' },
    { titleKey: 'home.how_step_2_title', descKey: 'home.how_step_2_desc' },
    { titleKey: 'home.how_step_3_title', descKey: 'home.how_step_3_desc' },
    { titleKey: 'home.how_step_4_title', descKey: 'home.how_step_4_desc' },
  ];

  setSimulation(mode: SimulationMode): void {
    this.activeSimulation.set(mode);
  }

  setHeroVisual(mode: HeroVisualMode): void {
    this.heroVisualMode.set(mode);
  }

  setAppTab(tab: 'web' | 'mobile'): void {
    this.activeAppTab.set(tab);
  }

  selectWebScreenshot(index: number): void {
    this.selectedWebScreenshot.set(index);
  }

  selectMobileScreenshot(index: number): void {
    this.selectedMobileScreenshot.set(index);
  }
}
