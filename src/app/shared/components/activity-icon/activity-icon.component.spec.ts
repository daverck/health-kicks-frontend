import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityIconComponent } from './activity-icon.component';

describe('ActivityIconComponent', () => {
  let component: ActivityIconComponent;
  let fixture: ComponentFixture<ActivityIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityIconComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('activityId', 'walk');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render SVG for walk activity', () => {
    fixture.componentRef.setInput('activityId', 'walk');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('should render SVG for stairs_up and stairs_down activities', () => {
    fixture.componentRef.setInput('activityId', 'stairs_up');
    fixture.detectChanges();
    let svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();

    fixture.componentRef.setInput('activityId', 'stairs_down');
    fixture.detectChanges();
    svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should render custom fallback SVG for unknown activity', () => {
    fixture.componentRef.setInput('activityId', 'custom_motion_xyz');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should accept custom size and className inputs', () => {
    fixture.componentRef.setInput('activityId', 'run');
    fixture.componentRef.setInput('size', 36);
    fixture.componentRef.setInput('className', 'text-emerald-500');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('36');
    expect(svg.getAttribute('height')).toBe('36');
    expect(svg.getAttribute('class')).toContain('text-emerald-500');
  });
});
