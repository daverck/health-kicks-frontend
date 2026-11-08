import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-history-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './studio-history-pagination.component.html',
})
export class StudioHistoryPaginationComponent {
  @Input({ required: true }) page = 1;
  @Input({ required: true }) size = 20;
  @Input({ required: true }) total = 0;
  @Input({ required: true }) totalPages = 1;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() pageInput = new EventEmitter<Event>();
}
