import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrototypeItem } from '../home.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-home-prototypes',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './home-prototypes.component.html',
})
export class HomePrototypesComponent {
  readonly prototypes = input.required<PrototypeItem[]>();
  readonly selectedPrototype = input.required<number>();

  readonly prototypeSelect = output<number>();
}
