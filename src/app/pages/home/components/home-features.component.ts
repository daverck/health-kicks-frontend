import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-home-features',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './home-features.component.html',
})
export class HomeFeaturesComponent {}
