import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { StudioModelsComponent } from './studio-models.component';
import { StudioService } from '../../core/services/studio.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

describe('StudioModelsComponent', () => {
  let component: StudioModelsComponent;
  let fixture: ComponentFixture<StudioModelsComponent>;
  let studioServiceMock: jasmine.SpyObj<StudioService>;

  beforeEach(async () => {
    studioServiceMock = jasmine.createSpyObj<StudioService>('StudioService', [
      'getModelsHistory',
      'getModelDetail',
    ]);
    studioServiceMock.getModelsHistory.and.returnValue(of([
      {
        version: 'v1.2.0',
        model_name: 'RandomForest_Standard',
        created_at: '2026-11-20T10:00:00Z',
        is_active: true,
        git_commit: 'commit123',
        f1_macro: 0.932,
        accuracy: 0.945,
        precision_macro: 0.938,
        recall_macro: 0.927,
        total_sessions: 42,
        total_windows: 1250,
      },
    ]));
    studioServiceMock.getModelDetail.and.returnValue(of({
      version: 'v1.2.0',
      model_name: 'RandomForest_Standard',
      created_at: '2026-11-20T10:00:00Z',
      is_active: true,
      metrics: { f1_macro: 0.932, accuracy: 0.945 },
      flash_usage_pct: 1.25,
      ram_usage_pct: 6.4,
    }));

    await TestBed.configureTestingModule({
      imports: [StudioModelsComponent, TranslatePipe],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: StudioService, useValue: studioServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and display model data', () => {
    expect(component).toBeTruthy();
    expect(studioServiceMock.getModelsHistory).toHaveBeenCalled();
  });

  it('should trigger onRefresh', () => {
    component.onRefresh();
    expect(studioServiceMock.getModelsHistory).toHaveBeenCalledTimes(2);
  });
});
