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

  it('should render SVGs for all redesigned movement and fall activities', () => {
    const cases: { id: string; expectCircle: boolean; expectedPaths: number }[] = [
      { id: 'walk', expectCircle: true, expectedPaths: 4 },
      { id: 'run', expectCircle: true, expectedPaths: 4 },
      { id: 'stairs_up', expectCircle: false, expectedPaths: 3 },
      { id: 'stairs_down', expectCircle: false, expectedPaths: 3 },
      { id: 'jump', expectCircle: true, expectedPaths: 5 },
      { id: 'stumble_recover', expectCircle: true, expectedPaths: 7 },
      { id: 'fall_forward', expectCircle: true, expectedPaths: 8 },
      { id: 'fall_backward', expectCircle: true, expectedPaths: 8 },
      { id: 'fall_lateral', expectCircle: true, expectedPaths: 7 },
      { id: 'fall_recovery', expectCircle: true, expectedPaths: 7 },
    ];

    for (const c of cases) {
      fixture.componentRef.setInput('activityId', c.id);
      fixture.detectChanges();
      const svg: SVGElement | null = fixture.nativeElement.querySelector('svg');
      expect(svg).withContext(`SVG for ${c.id}`).toBeTruthy();
      expect(svg!.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg!.querySelectorAll('circle').length).withContext(`circle for ${c.id}`).toBe(c.expectCircle ? 1 : 0);
      expect(svg!.querySelectorAll('path').length).withContext(`paths for ${c.id}`).toBe(c.expectedPaths);
    }
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
