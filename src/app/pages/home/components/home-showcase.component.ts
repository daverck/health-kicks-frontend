import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppTab, ScreenshotItem } from '../home.component';

@Component({
  selector: 'app-home-showcase',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './home-showcase.component.html',
})
export class HomeShowcaseComponent {
  readonly activeAppTab = input.required<AppTab>();
  readonly selectedWebScreenshot = input.required<number>();
  readonly selectedMobileScreenshot = input.required<number>();
  readonly selectedEmergencyScreenshot = input.required<number>();
  readonly webScreenshots = input.required<ScreenshotItem[]>();
  readonly mobileScreenshots = input.required<ScreenshotItem[]>();
  readonly emergencyScreenshots = input.required<ScreenshotItem[]>();

  readonly tabChange = output<AppTab>();
  readonly selectWeb = output<number>();
  readonly selectMobile = output<number>();
  readonly selectEmergency = output<number>();
}
