import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ActivitySelectComponent } from './activity-select.component';
import { PREDEFINED_LABELS, PredefinedLabel } from '../../../models/studio.model';

@Component({
  standalone: true,
  imports: [ActivitySelectComponent],
  template: `
    <app-activity-select
      [(selectedActivity)]="selectedActivity"
      [multiple]="multiple()"
      [(selectedActivities)]="selectedActivities"
      [allowAll]="allowAll()"
      [allValue]="allValue()"
      [allLabel]="allLabel()"
      [includeFalls]="includeFalls()"
      [fallsValue]="fallsValue()"
      [fallsLabel]="fallsLabel()"
      [disabled]="disabled()"
      [size]="size()"
      [fullWidth]="fullWidth()"
      (activityChange)="lastActivityChange = $event"
      (activitiesChange)="lastActivitiesChange = $event"
    />
  `,
})
class HostComponent {
  readonly selectedActivity = signal<string>('');
  readonly multiple = signal<boolean>(false);
  readonly selectedActivities = signal<string[]>([]);
  readonly allowAll = signal<boolean>(true);
  readonly allValue = signal<string>('');
  readonly allLabel = signal<string>('');
  readonly includeFalls = signal<boolean>(false);
  readonly fallsValue = signal<string>('falls');
  readonly fallsLabel = signal<string>('');
  readonly disabled = signal<boolean>(false);
  readonly size = signal<'sm' | 'md'>('md');
  readonly fullWidth = signal<boolean>(false);

  lastActivityChange: string | null = null;
  lastActivitiesChange: string[] = [];
}

describe('ActivitySelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: ActivitySelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, ActivitySelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  });

  it('should render trigger button with All option selected by default', () => {
    const trigger = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toContain('Tous les types d’activités');
  });

  it('should open and close dropdown on trigger click', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
    expect(fixture.nativeElement.querySelector('[data-testid="activity-select-dropdown"]')).toBeNull();

    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="activity-select-dropdown"]')).toBeTruthy();

    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="activity-select-dropdown"]')).toBeNull();
  });

  it('should select an activity label from dropdown', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
    trigger.click();
    fixture.detectChanges();

    const walkOption: HTMLButtonElement | null = fixture.nativeElement.querySelector('[data-testid="activity-option-walk"]');
    expect(walkOption).toBeTruthy();
    walkOption?.click();
    fixture.detectChanges();

    expect(host.selectedActivity()).toBe('walk');
    expect(host.lastActivityChange).toBe('walk');
    expect(fixture.nativeElement.querySelector('[data-testid="activity-select-dropdown"]')).toBeNull();

    // Trigger should now show walk label
    expect(trigger.textContent).toContain('Marche');
  });

  it('should select all option when clicked in dropdown', () => {
    host.selectedActivity.set('run');
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
    trigger.click();
    fixture.detectChanges();

    const allOption: HTMLButtonElement | null = fixture.nativeElement.querySelector('[data-testid="activity-option-all"]');
    expect(allOption).toBeTruthy();
    allOption?.click();
    fixture.detectChanges();

    expect(host.selectedActivity()).toBe('');
    expect(host.lastActivityChange).toBe('');
  });

  it('should support custom allValue and includeFalls', () => {
    host.allValue.set('all');
    host.selectedActivity.set('all');
    host.includeFalls.set(true);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
    trigger.click();
    fixture.detectChanges();

    // Falls option should be present
    const fallsOption: HTMLButtonElement | null = fixture.nativeElement.querySelector('[data-testid="activity-option-falls"]');
    expect(fallsOption).toBeTruthy();
    fallsOption?.click();
    fixture.detectChanges();

    expect(host.selectedActivity()).toBe('falls');
    expect(host.lastActivityChange).toBe('falls');
    expect(trigger.textContent).toContain('Chutes uniquement');
  });

  it('should filter activities by search query', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
    trigger.click();
    fixture.detectChanges();

    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector('#activity-search-field');
    expect(searchInput).toBeTruthy();

    searchInput.value = 'escalier';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="activity-option-stairs"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="activity-option-walk"]')).toBeNull();
  });

  it('should close dropdown on Escape key', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="activity-select-dropdown"]')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="activity-select-dropdown"]')).toBeNull();
  });

  it('should close dropdown when backdrop is clicked', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
    trigger.click();
    fixture.detectChanges();

    const backdrop: HTMLElement = fixture.nativeElement.querySelector('.fixed.inset-0');
    expect(backdrop).toBeTruthy();
    backdrop.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="activity-select-dropdown"]')).toBeNull();
  });

  it('should not open dropdown when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
    expect(trigger.disabled).toBeTrue();
    trigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="activity-select-dropdown"]')).toBeNull();
  });

  describe('Multiple Selection Mode', () => {
    beforeEach(() => {
      host.multiple.set(true);
      host.includeFalls.set(true);
      fixture.detectChanges();
    });

    it('should show all activities selected when selectedActivities is empty', () => {
      expect(component.isAllSelected()).toBeTrue();
      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
      expect(trigger.textContent).toMatch(/Tous les types d[’']activités/);
    });

    it('should toggle activities on and off, updating selectedActivities and emitting activitiesChange', () => {
      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
      trigger.click();
      fixture.detectChanges();

      // Checkboxes should be present
      const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);

      // Select walk
      const walkOption: HTMLButtonElement | null = fixture.nativeElement.querySelector('[data-testid="activity-option-walk"]');
      expect(walkOption).toBeTruthy();
      walkOption?.click();
      fixture.detectChanges();

      expect(host.selectedActivities()).toEqual(['walk']);
      expect(host.lastActivitiesChange).toEqual(['walk']);
      expect(component.isActivitySelected('walk')).toBeTrue();
      expect(component.isActivitySelected('run')).toBeFalse();
      expect(component.selectedCount()).toBe(1);

      // Select run
      const runOption: HTMLButtonElement | null = fixture.nativeElement.querySelector('[data-testid="activity-option-run"]');
      runOption?.click();
      fixture.detectChanges();

      expect(host.selectedActivities()).toEqual(['walk', 'run']);
      expect(component.selectedCount()).toBe(2);

      // Trigger should show count
      expect(trigger.textContent).toContain('2');

      // Unselect walk
      walkOption?.click();
      fixture.detectChanges();

      expect(host.selectedActivities()).toEqual(['run']);
      expect(component.selectedCount()).toBe(1);
    });

    it('should toggle falls correctly in multiple mode', () => {
      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
      trigger.click();
      fixture.detectChanges();

      const fallsOption: HTMLButtonElement | null = fixture.nativeElement.querySelector('[data-testid="activity-option-falls"]');
      expect(fallsOption).toBeTruthy();
      fallsOption?.click();
      fixture.detectChanges();

      expect(host.selectedActivities()).toEqual(['falls']);
      expect(component.isFallsSelected()).toBeTrue();
      expect(component.selectedCount()).toBe(1);

      // Select walk alongside falls
      const walkOption: HTMLButtonElement | null = fixture.nativeElement.querySelector('[data-testid="activity-option-walk"]');
      walkOption?.click();
      fixture.detectChanges();

      expect(host.selectedActivities()).toEqual(['falls', 'walk']);
      expect(component.selectedCount()).toBe(2);
    });

    it('should reset to all when selectAll() is clicked in multiple mode', () => {
      host.selectedActivities.set(['walk', 'run']);
      fixture.detectChanges();
      expect(component.isAllSelected()).toBeFalse();

      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="activity-select-trigger"]');
      trigger.click();
      fixture.detectChanges();

      const allOption: HTMLButtonElement | null = fixture.nativeElement.querySelector('[data-testid="activity-option-all"]');
      allOption?.click();
      fixture.detectChanges();

      expect(host.selectedActivities()).toEqual([]);
      expect(host.lastActivitiesChange).toEqual([]);
      expect(component.isAllSelected()).toBeTrue();
    });
  });
});
