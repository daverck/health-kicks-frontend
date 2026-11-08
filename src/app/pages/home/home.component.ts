import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

export type SimulationMode = 'walk' | 'fall' | 'idle';
export type HeroVisualMode = 'shoe' | 'web' | 'mobile';
export type AppTab = 'web' | 'mobile' | 'emergency';

export interface ScreenshotItem {
  titleKey: string;
  descKey: string;
  imageSrc: string;
  tag: string;
  isWebMockup?: boolean;
}

export interface PrototypeItem {
  id: number;
  titleKey: string;
  subtitleKey: string;
  descKey: string;
  anecdoteKey?: string;
  imageSrc: string;
  tag: string;
  specs: string[];
}

import { HomeHeroComponent } from './components/home-hero.component';
import { HomeFeaturesComponent } from './components/home-features.component';
import { HomeShowcaseComponent } from './components/home-showcase.component';
import { HomePrototypesComponent } from './components/home-prototypes.component';
import { HomeHowItWorksComponent } from './components/home-how-it-works.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    LanguageSelectorComponent,
    ThemeToggleComponent,
    HomeHeroComponent,
    HomeFeaturesComponent,
    HomeShowcaseComponent,
    HomePrototypesComponent,
    HomeHowItWorksComponent,
  ],
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
  readonly activeAppTab = signal<AppTab>('web');
  readonly selectedWebScreenshot = signal(0);
  readonly selectedMobileScreenshot = signal(0);
  readonly selectedEmergencyScreenshot = signal(0);

  // Prototype history state
  readonly selectedPrototype = signal(0);

  readonly webScreenshots: ScreenshotItem[] = [
    {
      titleKey: 'home.showcase_web_1_title',
      descKey: 'home.showcase_web_1_desc',
      imageSrc: '/images/screenshots/web_showcase_3d_stairs_up.avif',
      tag: 'Visualisation 3D',
      isWebMockup: true,
    },
    {
      titleKey: 'home.showcase_web_2_title',
      descKey: 'home.showcase_web_2_desc',
      imageSrc: '/images/screenshots/web_showcase_studio_capture.avif',
      tag: 'Studio Capture',
      isWebMockup: true,
    },
    {
      titleKey: 'home.showcase_web_3_title',
      descKey: 'home.showcase_web_3_desc',
      imageSrc: '/images/screenshots/web_showcase_ml_stats.avif',
      tag: 'Benchmark Edge AI',
      isWebMockup: true,
    },
    {
      titleKey: 'home.showcase_web_4_title',
      descKey: 'home.showcase_web_4_desc',
      imageSrc: '/images/screenshots/web_showcase_pedometer.avif',
      tag: 'Podomètre',
      isWebMockup: true,
    },
    {
      titleKey: 'home.showcase_web_5_title',
      descKey: 'home.showcase_web_5_desc',
      imageSrc: '/images/screenshots/web_showcase_activity_history.avif',
      tag: 'Détections',
      isWebMockup: true,
    },
  ];

  readonly mobileScreenshots: ScreenshotItem[] = [
    {
      titleKey: 'home.showcase_mobile_1_title',
      descKey: 'home.showcase_mobile_1_desc',
      imageSrc: '/images/screenshots/mobile_showcase_dashboard.avif',
      tag: 'Dashboard',
    },
    {
      titleKey: 'home.showcase_mobile_2_title',
      descKey: 'home.showcase_mobile_2_desc',
      imageSrc: '/images/screenshots/mobile_showcase_steps_history.avif',
      tag: 'Historique',
    },
    {
      titleKey: 'home.showcase_mobile_4_title',
      descKey: 'home.showcase_mobile_4_desc',
      imageSrc: '/images/screenshots/mobile_showcase_settings.avif',
      tag: 'Paramètres & Sédentarité',
    },
    {
      titleKey: 'home.showcase_mobile_5_title',
      descKey: 'home.showcase_mobile_5_desc',
      imageSrc: '/images/screenshots/mobile_showcase_ota_update.avif',
      tag: 'OTA BLE',
    },
    {
      titleKey: 'home.showcase_mobile_6_title',
      descKey: 'home.showcase_mobile_6_desc',
      imageSrc: '/images/screenshots/mobile_showcase_calibration.avif',
      tag: 'Calibration IMU',
    },
  ];

  readonly emergencyScreenshots: ScreenshotItem[] = [
    {
      titleKey: 'home.showcase_emergency_1_title',
      descKey: 'home.showcase_emergency_1_desc',
      imageSrc: '/images/screenshots/emergency_showcase_fall_detected.avif',
      tag: '1. Alerte Chute',
    },
    {
      titleKey: 'home.showcase_emergency_2_title',
      descKey: 'home.showcase_emergency_2_desc',
      imageSrc: '/images/screenshots/emergency_showcase_fall_acknowledged.avif',
      tag: '2. Prise en Charge',
    },
    {
      titleKey: 'home.showcase_emergency_3_title',
      descKey: 'home.showcase_emergency_3_desc',
      imageSrc: '/images/screenshots/emergency_showcase_fall_expired.avif',
      tag: '3. Failsafe Expiration',
    },
    {
      titleKey: 'home.showcase_emergency_4_title',
      descKey: 'home.showcase_emergency_4_desc',
      imageSrc: '/images/screenshots/emergency_showcase_fall_dashboard.avif',
      tag: '4. Traçabilité Clinique',
      isWebMockup: true,
    },
  ];

  readonly prototypes: PrototypeItem[] = [
    {
      id: 1,
      titleKey: 'home.proto_1_title',
      subtitleKey: 'home.proto_1_subtitle',
      descKey: 'home.proto_1_desc',
      imageSrc: '/images/screenshots/prototype_1_raspberry_arduino.avif',
      tag: 'Preuve de Concept',
      specs: ['Arduino Nano + Raspberry Pi 3', 'Connexion Wi-Fi & MPU-6050', 'Matériel de récupération'],
    },
    {
      id: 2,
      titleKey: 'home.proto_2_title',
      subtitleKey: 'home.proto_2_subtitle',
      descKey: 'home.proto_2_desc',
      anecdoteKey: 'home.proto_2_anecdote',
      imageSrc: '/images/screenshots/prototype_2_esp32_breadboard.avif',
      tag: 'SoC ESP32-S3',
      specs: ['Microcontrôleur ESP32-S3', 'NimBLE Server & IA temps réel', 'Composants fixés à la colle époxy'],
    },
    {
      id: 3,
      titleKey: 'home.proto_3_title',
      subtitleKey: 'home.proto_3_subtitle',
      descKey: 'home.proto_3_desc',
      anecdoteKey: 'home.proto_3_anecdote',
      imageSrc: '/images/screenshots/prototype_3_esp32_powerbank.avif',
      tag: 'Portable & Genèse OTA',
      specs: ['Perfboard compacte', 'Alimentation Power Bank externe', 'Bootloader OTA BLE résilient'],
    },
    {
      id: 4,
      titleKey: 'home.proto_4_title',
      subtitleKey: 'home.proto_4_subtitle',
      descKey: 'home.proto_4_desc',
      imageSrc: '/images/screenshots/prototype_4_esp32_battery.avif',
      tag: 'Autonomie LiPo',
      specs: ['Batterie LiPo + Convertisseur DC/DC', 'Deep/Light Sleep FreeRTOS', 'Précurseur du clip lacet'],
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

  setAppTab(tab: AppTab): void {
    this.activeAppTab.set(tab);
  }

  selectWebScreenshot(index: number): void {
    this.selectedWebScreenshot.set(index);
  }

  selectMobileScreenshot(index: number): void {
    this.selectedMobileScreenshot.set(index);
  }

  selectEmergencyScreenshot(index: number): void {
    this.selectedEmergencyScreenshot.set(index);
  }

  selectPrototype(index: number): void {
    this.selectedPrototype.set(index);
  }
}
