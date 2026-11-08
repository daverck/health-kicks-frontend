import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeviceResponse } from '../../../models/api.models';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-device-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './device-card.component.html',
})
export class DeviceCardComponent {
  @Input({ required: true }) device!: DeviceResponse;
  @Output() unbind = new EventEmitter<DeviceResponse>();

  onUnbind(): void {
    this.unbind.emit(this.device);
  }
}
