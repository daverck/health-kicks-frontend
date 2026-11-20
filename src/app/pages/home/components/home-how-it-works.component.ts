import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-home-how-it-works',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ScrollRevealDirective],
  templateUrl: './home-how-it-works.component.html',
})
export class HomeHowItWorksComponent {
  readonly steps = input.required<{ titleKey: string; descKey: string }[]>();
}
