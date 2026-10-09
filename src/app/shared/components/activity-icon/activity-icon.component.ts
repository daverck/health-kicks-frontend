import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-activity-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (normalizedId()) {
      @case ('walk') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="13.5" cy="4.5" r="2" />
          <path d="M7 21l3-4 2 1.5 2-4.5-2.5-3 2-2" />
          <path d="M10 13l-3 1" />
          <path d="M14 9l3 2-1 3" />
          <path d="M12 18.5l2.5 2.5" />
        </svg>
      }
      @case ('run') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="17" cy="4.5" r="2" />
          <path d="M5 19l4.5-3.5 2 1 2.5-4.5-3-2 3-2" />
          <path d="M11 12l-4 1.5" />
          <path d="M14 9l3.5 1-1 3" />
          <path d="M14 16l4 3.5 2.5-1" />
        </svg>
      }
      @case ('idle') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M6 19v2M18 19v2" />
          <path d="M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-4z" />
          <path d="M4 13h2M18 13h2" />
          <path d="M8 9V6a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v3" />
          <circle cx="12" cy="13.5" r="1.5" fill="currentColor" />
        </svg>
      }
      @case ('stairs') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M4 19h4v-4h4v-4h4V7h4" />
          <path d="M4 19v2h16v-2" />
        </svg>
      }
      @case ('stairs_up') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M3 20h4v-4h4v-4h4V8h5" />
          <path d="M15 4h5v5" />
          <path d="M13 11l7-7" />
        </svg>
      }
      @case ('stairs_down') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M3 8h5v4h4v4h4v4h5" />
          <path d="M15 20h5v-5" />
          <path d="M13 13l7 7" />
        </svg>
      }
      @case ('jump') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="12" cy="4.5" r="2" />
          <path d="M9 13l3-4 3 4" />
          <path d="M7 11l5-2 5 2" />
          <path d="M10 15l-2.5 3.5" />
          <path d="M14 15l2.5 3.5" />
          <path d="M6 21h12" />
          <path d="M12 17v3" />
        </svg>
      }
      @case ('stumble_recover') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="16" cy="4.5" r="2" />
          <path d="M8 12l4-2 3 3-2 5-3-1" />
          <path d="M6 16l3-1" />
          <path d="M13 18l3 3" />
          <path d="M4 4l2 2" />
          <path d="M3 9h2" />
          <path d="M19 12a4 4 0 0 0 2-3" />
        </svg>
      }
      @case ('fall_forward') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="19" cy="8.5" r="2" />
          <path d="M4 19l4.5-3 5 1 3-3-2-2" />
          <path d="M11.5 14.5l-4-1" />
          <path d="M3 21h18" />
          <path d="M17.5 14l3.5 2" />
        </svg>
      }
      @case ('fall_backward') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="5" cy="8.5" r="2" />
          <path d="M20 19l-4.5-3-5 1-3-3 2-2" />
          <path d="M12.5 14.5l4-1" />
          <path d="M3 21h18" />
          <path d="M6.5 14l-3.5 2" />
        </svg>
      }
      @case ('fall_lateral') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="15" cy="5.5" r="2" />
          <path d="M8 19l3-6 4 2-1 4" />
          <path d="M6 15l3-2" />
          <path d="M15 15l3 4" />
          <path d="M3 21h18" />
          <path d="M19 11l2-1M19 14l2 1" />
        </svg>
      }
      @case ('fall_recovery') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="8" cy="13" r="2" />
          <path d="M4 19l4-2 3 2 4-3" />
          <path d="M3 21h18" />
          <path d="M14 9a5 5 0 1 1-1 4.5" />
          <path d="M14 5v4h-4" />
        </svg>
      }
      @default {
        <!-- Custom/experimental activity icon (laboratory flask / tag) -->
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M10 2v7.31a2 2 0 0 1-.59 1.41L4.7 15.43a2 2 0 0 0-.58 1.41V20a2 2 0 0 0 2 2h11.76a2 2 0 0 0 2-2v-3.16a2 2 0 0 0-.58-1.41l-4.71-4.71a2 2 0 0 1-.59-1.41V2" />
          <path d="M8.5 2h7M7 16h10" />
        </svg>
      }
    }
  `,
})
export class ActivityIconComponent {
  readonly activityId = input.required<string>();
  readonly size = input<number>(24);
  readonly className = input<string>('');

  readonly normalizedId = computed(() => this.activityId()?.toLowerCase().trim() ?? '');
}
