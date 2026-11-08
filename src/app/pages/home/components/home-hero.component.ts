import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { HeroVisualMode, SimulationMode, AppTab } from '../home.component';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './home-hero.component.html',
})
export class HomeHeroComponent {
  readonly isAuthenticated = input.required<boolean>();
  readonly showWordplay = input.required<boolean>();
  readonly heroVisualMode = input.required<HeroVisualMode>();
  readonly activeSimulation = input.required<SimulationMode>();

  readonly heroVisualChange = output<HeroVisualMode>();
  readonly simulationChange = output<SimulationMode>();
  readonly exploreTab = output<AppTab>();
}
