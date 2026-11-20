import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-home-features',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ScrollRevealDirective],
  templateUrl: './home-features.component.html',
})
export class HomeFeaturesComponent {}
