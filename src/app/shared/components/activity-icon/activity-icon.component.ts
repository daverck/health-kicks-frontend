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
          <circle cx="13" cy="4.5" r="2" />
          <path d="M12.5 7L11.5 13.5" />
          <path d="M7.5 12.5L9 10.5L12.2 8.5L15.5 11L17.5 9.5" />
          <path d="M11.5 13.5L14.5 17L15.5 21" />
          <path d="M11.5 13.5L9 17L7 20.5" />
        </svg>
      }
      @case ('run') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="15.5" cy="4.5" r="2" />
          <path d="M14 7L10.5 13" />
          <path d="M7.5 10.5L10 8L13.2 8.2L16.5 10.5L18.5 8.5" />
          <path d="M10.5 13L15 15.5L17.5 19.5" />
          <path d="M10.5 13L7.5 16.5L4.5 17.5" />
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
      @case ('sit_down') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
          <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" />
          <path d="M5 18v2M19 18v2" />
        </svg>
      }
      @case ('stand_up') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="12" cy="4" r="2" />
          <path d="M12 6v8" />
          <path d="M9 10l3-2 3 2" />
          <path d="M9 20l3-6 3 6" />
        </svg>
      }
      @case ('lie_down') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M2 19h20" />
          <path d="M4 19v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
          <circle cx="8" cy="10" r="2" />
          <path d="M12 11l4 2" />
        </svg>
      }
      @case ('lying_supine') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M2 19h20" />
          <path d="M3 15h18" />
          <circle cx="6" cy="11.5" r="2" />
          <path d="M10 13h9" />
          <path d="M19 13v2" />
        </svg>
      }
      @case ('lying_prone') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M2 19h20" />
          <path d="M3 15h18" />
          <circle cx="6" cy="12.5" r="2" />
          <path d="M10 13h9" />
          <path d="M4 14l2 1" />
        </svg>
      }
      @case ('lying_lateral') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M2 19h20" />
          <path d="M3 15h18" />
          <circle cx="6" cy="11" r="2" />
          <path d="M10 12h8" />
          <path d="M14 12l2 3" />
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
          <path d="M4 20h4v-4h4v-4h4V8h4" />
          <path d="M4 11L11 4" />
          <path d="M7 4h4v4" />
        </svg>
      }
      @case ('stairs_down') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M4 8h4v4h4v4h4v4h4" />
          <path d="M13 4l7 7" />
          <path d="M16 11h4V7" />
        </svg>
      }
      @case ('jump') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <circle cx="12" cy="4.5" r="2" />
          <path d="M6.5 6L12 9L17.5 6" />
          <path d="M12 7v6.5" />
          <path d="M12 13.5L8.5 16L9.5 19" />
          <path d="M12 13.5L15.5 16L14.5 19" />
          <path d="M7 22h10" />
        </svg>
      }
      @case ('stumble_recover') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M3 21h18" />
          <path d="M9 21l1.5-2.5L12 21" />
          <circle cx="16.5" cy="5.5" r="2" />
          <path d="M15 7.5L11 13.5" />
          <path d="M10.5 6.5L13.8 9.2L18.5 10.5" />
          <path d="M11 13.5L8.5 17L6 18.5" />
          <path d="M11 13.5L15 16.5L15.5 21" />
          <path d="M6 9.5l2.5-1" />
        </svg>
      }
      @case ('fall_forward') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M3 21h18" />
          <circle cx="18.5" cy="14" r="2" />
          <path d="M10 11.5L16 13.5" />
          <path d="M15 13.2L17.5 18.5L19.5 19" />
          <path d="M14 12.8L14.5 18.5" />
          <path d="M10 11.5L6 13L4 16.5" />
          <path d="M10 11.5L7.5 16L6 20.5" />
          <path d="M11 5.5c3.5 0 6.5 2 7.5 5" />
          <path d="M16.5 9.5l2 1 0.5-2.2" />
        </svg>
      }
      @case ('fall_backward') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M3 21h18" />
          <circle cx="5.5" cy="13.5" r="2" />
          <path d="M8 13.5L13.5 15" />
          <path d="M9.5 13.8L8 9L6 8" />
          <path d="M9.5 13.8L12 9.5" />
          <path d="M13.5 15L17.5 13.5L20 15" />
          <path d="M13.5 15L17 18L19.5 20" />
          <path d="M13 5.5c-3.5 0-6.5 2-7.5 5" />
          <path d="M7.5 9.5l-2 1-0.5-2.2" />
        </svg>
      }
      @case ('fall_lateral') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M3 21h18" />
          <circle cx="16.5" cy="7" r="2" />
          <path d="M15 8.5L10.5 14" />
          <path d="M11 5.5L13.8 10L18.5 13.5" />
          <path d="M10.5 14L9.5 20.5" />
          <path d="M10.5 14L5.5 12.5" />
          <path d="M19.5 9.5c1 2 1 4.5 0 6.5" />
          <path d="M18 14.5l1.5 1.5 1.5-1" />
        </svg>
      }
      @case ('fall_recovery') {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class]="className()">
          <path d="M3 21h18" />
          <circle cx="13.5" cy="8" r="2" />
          <path d="M7.5 15.5L12 10.5" />
          <path d="M4 20.5h2.5l1-5" />
          <path d="M7.5 15.5h4v5" />
          <path d="M10.8 11.8L14 14" />
          <path d="M18.5 18V6" />
          <path d="M16 8.5L18.5 6L21 8.5" />
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
