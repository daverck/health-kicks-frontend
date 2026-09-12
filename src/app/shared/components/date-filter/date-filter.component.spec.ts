import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateFilterComponent } from './date-filter.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('DateFilterComponent', () => {
  let component: DateFilterComponent;
  let fixture: ComponentFixture<DateFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateFilterComponent],
      providers: [TranslationService],
    }).compileComponents();

    fixture = TestBed.createComponent(DateFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle dropdown open and closed', () => {
    expect(component.isOpen()).toBeFalse();
    component.toggleDropdown();
    expect(component.isOpen()).toBeTrue();
    component.toggleDropdown();
    expect(component.isOpen()).toBeFalse();
  });

  it('should apply preset today correctly', () => {
    spyOn(component.dateChange, 'emit');
    component.openDropdown();
    component.applyPreset('today');

    expect(component.startDate()).toBeTruthy();
    expect(component.endDate()).toBe(component.startDate());
    expect(component.dateChange.emit).toHaveBeenCalledWith({
      startDate: component.startDate(),
      endDate: component.endDate(),
    });
    expect(component.isOpen()).toBeFalse();
  });

  it('should apply preset 7days correctly', () => {
    spyOn(component.dateChange, 'emit');
    component.openDropdown();
    component.applyPreset('7days');

    expect(component.startDate()).toBeTruthy();
    expect(component.endDate()).toBeTruthy();
    expect(component.startDate() <= component.endDate()).toBeTrue();
    expect(component.dateChange.emit).toHaveBeenCalledWith({
      startDate: component.startDate(),
      endDate: component.endDate(),
    });
  });

  it('should auto-sort inverted custom dates upon apply', () => {
    spyOn(component.dateChange, 'emit');
    component.openDropdown();
    component.tempStartDate.set('2026-09-20');
    component.tempEndDate.set('2026-09-10');
    component.apply();

    expect(component.startDate()).toBe('2026-09-10');
    expect(component.endDate()).toBe('2026-09-20');
    expect(component.dateChange.emit).toHaveBeenCalledWith({
      startDate: '2026-09-10',
      endDate: '2026-09-20',
    });
  });

  it('should clear selection and emit empty dates', () => {
    component.startDate.set('2026-09-01');
    component.endDate.set('2026-09-10');
    fixture.detectChanges();

    spyOn(component.dateChange, 'emit');
    component.clear();

    expect(component.startDate()).toBe('');
    expect(component.endDate()).toBe('');
    expect(component.dateChange.emit).toHaveBeenCalledWith({
      startDate: '',
      endDate: '',
    });
    expect(component.hasActiveFilter()).toBeFalse();
  });

  it('should format date display properly', () => {
    expect(component.formatDateDisplay('2026-09-13')).toBe('13/09/2026');
    expect(component.formatDateDisplay('')).toBe('');
  });

  it('should close on escape key', () => {
    component.openDropdown();
    expect(component.isOpen()).toBeTrue();
    component.onEscape();
    expect(component.isOpen()).toBeFalse();
  });
});
