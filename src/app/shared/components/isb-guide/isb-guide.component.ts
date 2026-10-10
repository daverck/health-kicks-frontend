import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-isb-guide',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './isb-guide.component.html',
})
export class IsbGuideComponent {
  readonly showIsbGuide = signal<boolean>(false);

  toggleIsbGuide(): void {
    this.showIsbGuide.update((v) => !v);
  }
}

