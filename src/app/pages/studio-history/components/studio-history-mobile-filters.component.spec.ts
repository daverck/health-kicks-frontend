import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { StudioHistoryMobileFiltersComponent } from './studio-history-mobile-filters.component';

describe('StudioHistoryMobileFiltersComponent', () => {
  let component: StudioHistoryMobileFiltersComponent;
  let fixture: ComponentFixture<StudioHistoryMobileFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, StudioHistoryMobileFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioHistoryMobileFiltersComponent);
    component = fixture.componentInstance;
    component.hasActiveFilters = true;
    fixture.detectChanges();
  });

  it('should render reset button when active filters and emit reset on click', () => {
    expect(component).toBeTruthy();
    spyOn(component.resetFilters, 'emit');
    const resetBtn = fixture.nativeElement.querySelector('button[type="button"]') as HTMLElement;
    expect(resetBtn).toBeTruthy();
    resetBtn.click();
    expect(component.resetFilters.emit).toHaveBeenCalled();
  });
});
