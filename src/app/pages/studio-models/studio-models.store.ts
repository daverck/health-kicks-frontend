import { Injectable, computed, inject, signal } from '@angular/core';
import { StudioService } from '../../core/services/studio.service';
import {
  MLModelDetailResponse,
  MLModelSummaryResponse,
  MLModelMetrics,
} from '../../models/telemetry.models';

export interface ModelComparisonDeltas {
  deltaF1: number;
  deltaAccuracy: number;
  deltaPrecision: number;
  deltaRecall: number;
  deltaFlashPct: number;
  deltaRamPct: number;
  deltaCHeaderBytes: number;
  classDeltas: Array<{
    label: string;
    baseF1: number;
    compF1: number;
    deltaF1: number;
  }>;
}

@Injectable()
export class StudioModelsStore {
  private readonly studioService = inject(StudioService);

  readonly models = signal<MLModelSummaryResponse[]>([]);
  readonly selectedVersion = signal<string | null>(null);
  readonly selectedModelDetail = signal<MLModelDetailResponse | null>(null);
  readonly comparatorVersion = signal<string | null>(null);
  readonly comparatorModelDetail = signal<MLModelDetailResponse | null>(null);

  readonly isLoading = signal<boolean>(true);
  readonly isDetailLoading = signal<boolean>(false);
  readonly isComparatorLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /** Active champion model currently deployed or configured on edge devices */
  readonly championModel = computed<MLModelSummaryResponse | null>(() => {
    return this.models().find((m) => m.is_active) ?? null;
  });

  /** Summary metadata for the currently inspected model version */
  readonly selectedModelSummary = computed<MLModelSummaryResponse | null>(() => {
    const version = this.selectedVersion();
    if (!version) return null;
    return this.models().find((m) => m.version === version) ?? null;
  });

  /** Summary metadata for the comparator challenger model */
  readonly comparatorModelSummary = computed<MLModelSummaryResponse | null>(() => {
    const version = this.comparatorVersion();
    if (!version) return null;
    return this.models().find((m) => m.version === version) ?? null;
  });

  /** Key performance indicators for the selected model version */
  readonly kpis = computed(() => {
    const summary = this.selectedModelSummary();
    const detail = this.selectedModelDetail();
    const metrics = (detail?.metrics as MLModelMetrics) ?? null;

    const f1Macro = metrics?.f1_macro ?? summary?.f1_macro ?? 0;
    const accuracy = metrics?.accuracy ?? summary?.accuracy ?? 0;
    const precisionMacro = metrics?.precision_macro ?? summary?.precision_macro ?? 0;
    const recallMacro = metrics?.recall_macro ?? summary?.recall_macro ?? 0;
    const totalWindows =
      (detail?.dataset_summary?.['total_windows'] as number) ?? summary?.total_windows ?? 0;
    const totalSessions =
      (detail?.dataset_summary?.['total_sessions'] as number) ?? summary?.total_sessions ?? 0;
    const flashUsagePct = detail?.flash_usage_pct ?? null;
    const ramUsagePct = detail?.ram_usage_pct ?? null;
    const cHeaderSizeBytes = detail?.c_header_size_bytes ?? null;

    return {
      version: detail?.version ?? summary?.version ?? '',
      modelName: detail?.model_name ?? summary?.model_name ?? '',
      isActive: detail?.is_active ?? summary?.is_active ?? false,
      gitCommit: detail?.git_commit ?? summary?.git_commit ?? null,
      createdAt: detail?.created_at ?? summary?.created_at ?? '',
      f1Macro,
      accuracy,
      precisionMacro,
      recallMacro,
      totalWindows,
      totalSessions,
      flashUsagePct,
      ramUsagePct,
      cHeaderSizeBytes,
      isTargetF1Met: f1Macro >= 0.75,
    };
  });

  /** Side-by-side metric deltas between base selected model and comparator model */
  readonly comparisonDeltas = computed<ModelComparisonDeltas | null>(() => {
    const baseDetail = this.selectedModelDetail();
    const compDetail = this.comparatorModelDetail();
    if (!baseDetail || !compDetail) return null;

    const baseMetrics = (baseDetail.metrics as MLModelMetrics) ?? {};
    const compMetrics = (compDetail.metrics as MLModelMetrics) ?? {};

    const baseF1 = Number(baseMetrics.f1_macro ?? 0);
    const compF1 = Number(compMetrics.f1_macro ?? 0);
    const baseAcc = Number(baseMetrics.accuracy ?? 0);
    const compAcc = Number(compMetrics.accuracy ?? 0);
    const basePrec = Number(baseMetrics.precision_macro ?? 0);
    const compPrec = Number(compMetrics.precision_macro ?? 0);
    const baseRec = Number(baseMetrics.recall_macro ?? 0);
    const compRec = Number(compMetrics.recall_macro ?? 0);

    const baseFlash = Number(baseDetail.flash_usage_pct ?? 0);
    const compFlash = Number(compDetail.flash_usage_pct ?? 0);
    const baseRam = Number(baseDetail.ram_usage_pct ?? 0);
    const compRam = Number(compDetail.ram_usage_pct ?? 0);
    const baseCHeader = Number(baseDetail.c_header_size_bytes ?? 0);
    const compCHeader = Number(compDetail.c_header_size_bytes ?? 0);

    const baseClasses = baseMetrics.class_metrics ?? {};
    const compClasses = compMetrics.class_metrics ?? {};
    const allLabels = Array.from(new Set([...Object.keys(baseClasses), ...Object.keys(compClasses)])).sort();

    const classDeltas = allLabels.map((lbl) => {
      const bScore = baseClasses[lbl]?.f1_score ?? 0;
      const cScore = compClasses[lbl]?.f1_score ?? 0;
      return {
        label: lbl,
        baseF1: bScore,
        compF1: cScore,
        deltaF1: Number((cScore - bScore).toFixed(4)),
      };
    });

    return {
      deltaF1: Number((compF1 - baseF1).toFixed(4)),
      deltaAccuracy: Number((compAcc - baseAcc).toFixed(4)),
      deltaPrecision: Number((compPrec - basePrec).toFixed(4)),
      deltaRecall: Number((compRec - baseRec).toFixed(4)),
      deltaFlashPct: Number((compFlash - baseFlash).toFixed(2)),
      deltaRamPct: Number((compRam - baseRam).toFixed(2)),
      deltaCHeaderBytes: compCHeader - baseCHeader,
      classDeltas,
    };
  });

  /** Class-level metrics for the selected model */
  readonly selectedClassMetrics = computed(() => {
    const metrics = (this.selectedModelDetail()?.metrics as MLModelMetrics) ?? null;
    return metrics?.class_metrics ?? {};
  });

  /** Confusion matrix for the selected model */
  readonly selectedConfusionMatrix = computed(() => {
    const metrics = (this.selectedModelDetail()?.metrics as MLModelMetrics) ?? null;
    return metrics?.confusion_matrix ?? null;
  });

  loadHistory(targetVersion?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.studioService.getModelsHistory().subscribe({
      next: (models) => {
        this.models.set(models);
        this.isLoading.set(false);

        if (models.length > 0) {
          const versionToSelect =
            targetVersion ??
            this.selectedVersion() ??
            models.find((m) => m.is_active)?.version ??
            models[0].version;

          this.selectVersion(versionToSelect);
        }
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail || 'Failed to load ML model history.'
        );
        this.isLoading.set(false);
      },
    });
  }

  selectVersion(version: string): void {
    this.selectedVersion.set(version);
    this.isDetailLoading.set(true);

    this.studioService.getModelDetail(version).subscribe({
      next: (detail) => {
        this.selectedModelDetail.set(detail);
        this.isDetailLoading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail || `Failed to load details for model ${version}.`
        );
        this.isDetailLoading.set(false);
      },
    });
  }

  setComparatorVersion(version: string | null): void {
    if (!version || version === this.selectedVersion()) {
      this.clearComparator();
      return;
    }

    this.comparatorVersion.set(version);
    this.isComparatorLoading.set(true);

    this.studioService.getModelDetail(version).subscribe({
      next: (detail) => {
        this.comparatorModelDetail.set(detail);
        this.isComparatorLoading.set(false);
      },
      error: () => {
        this.isComparatorLoading.set(false);
      },
    });
  }

  clearComparator(): void {
    this.comparatorVersion.set(null);
    this.comparatorModelDetail.set(null);
  }
}
