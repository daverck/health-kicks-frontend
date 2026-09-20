import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudioHistoryService } from '../../core/services/studio-history.service';
import { StudioSessionSummary } from '../../models/studio-history.model';
import { StudioInspectionComponent } from '../../shared/components/studio-inspection/studio-inspection.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-studio-session-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    StudioInspectionComponent,
  ],
  templateUrl: './studio-session-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioSessionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studioHistoryService = inject(StudioHistoryService);

  readonly sessionId = signal<string | null>(null);
  readonly session = signal<StudioSessionSummary | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId.set(id);
      this.loadSession(id);
    } else {
      this.isLoading.set(false);
      this.errorMessage.set('Identifiant de session manquant.');
    }
  }

  loadSession(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studioHistoryService.getSession(id).subscribe({
      next: (data) => {
        this.session.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.status === 404
            ? 'studio_history.session_not_found_desc'
            : (err?.error?.detail ?? 'studio_history.error_loading')
        );
      },
    });
  }

  onSessionUpdated(updated: StudioSessionSummary): void {
    this.session.set(updated);
  }

  onSessionConfirmed(confirmed: StudioSessionSummary): void {
    this.session.set(confirmed);
  }

  onSessionDeleted(): void {
    this.router.navigate(['/dashboard/studio/history']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/studio/history']);
  }
}
