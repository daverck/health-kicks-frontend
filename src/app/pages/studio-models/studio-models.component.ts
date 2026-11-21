import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { StudioModelsStore } from './studio-models.store';
import { StudioModelsKpiCardsComponent } from './components/studio-models-kpi-cards.component';
import { StudioModelsHistoryTableComponent } from './components/studio-models-history-table.component';
import { StudioModelsFirmwareCardComponent } from './components/studio-models-firmware-card.component';
import { StudioModelsClassMetricsComponent } from './components/studio-models-class-metrics.component';
import { StudioModelsConfusionMatrixComponent } from './components/studio-models-confusion-matrix.component';
import { StudioModelsComparatorComponent } from './components/studio-models-comparator.component';

@Component({
  selector: 'app-studio-models',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    StudioModelsKpiCardsComponent,
    StudioModelsHistoryTableComponent,
    StudioModelsFirmwareCardComponent,
    StudioModelsClassMetricsComponent,
    StudioModelsConfusionMatrixComponent,
    StudioModelsComparatorComponent,
  ],
  providers: [StudioModelsStore],
  templateUrl: './studio-models.component.html',
})
export class StudioModelsComponent implements OnInit {
  private readonly store = inject(StudioModelsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly models = this.store.models;
  readonly selectedVersion = this.store.selectedVersion;
  readonly selectedModelDetail = this.store.selectedModelDetail;
  readonly comparatorVersion = this.store.comparatorVersion;
  readonly comparatorModelDetail = this.store.comparatorModelDetail;

  readonly isLoading = this.store.isLoading;
  readonly isDetailLoading = this.store.isDetailLoading;
  readonly error = this.store.error;

  readonly kpis = this.store.kpis;
  readonly comparisonDeltas = this.store.comparisonDeltas;
  readonly selectedClassMetrics = this.store.selectedClassMetrics;
  readonly selectedConfusionMatrix = this.store.selectedConfusionMatrix;

  ngOnInit(): void {
    const routeVersion = this.route.snapshot.paramMap.get('version');
    this.store.loadHistory(routeVersion ?? undefined);
  }

  onRefresh(): void {
    this.store.loadHistory();
  }

  onInspect(version: string): void {
    this.store.selectVersion(version);
    this.router.navigate(['/dashboard/studio/models', version]);
  }

  onCompare(version: string): void {
    this.store.setComparatorVersion(version);
  }

  onClearComparator(): void {
    this.store.clearComparator();
  }
}
