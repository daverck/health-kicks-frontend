import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { StudioHistoryPaginationComponent } from './studio-history-pagination.component';

describe('StudioHistoryPaginationComponent', () => {
  let component: StudioHistoryPaginationComponent;
  let fixture: ComponentFixture<StudioHistoryPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, StudioHistoryPaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioHistoryPaginationComponent);
    component = fixture.componentInstance;
    component.page = 2;
    component.size = 20;
    component.total = 100;
    component.totalPages = 5;
    fixture.detectChanges();
  });

  it('should create and render pagination buttons', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#first-page-btn')).toBeTruthy();
    expect(compiled.querySelector('#next-page-btn')).toBeTruthy();
  });

  it('should emit pageChange when next is clicked', () => {
    spyOn(component.pageChange, 'emit');
    const nextBtn = fixture.nativeElement.querySelector('#next-page-btn') as HTMLElement;
    nextBtn.click();
    expect(component.pageChange.emit).toHaveBeenCalledWith(3);
  });
});
