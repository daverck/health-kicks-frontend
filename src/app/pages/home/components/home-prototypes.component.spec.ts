import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HomePrototypesComponent } from './home-prototypes.component';
import { TranslationService } from '../../../core/services/translation.service';
import { PrototypeItem } from '../home.component';

describe('HomePrototypesComponent', () => {
  let component: HomePrototypesComponent;
  let fixture: ComponentFixture<HomePrototypesComponent>;

  const mockPrototypes: PrototypeItem[] = [
    {
      id: 1,
      titleKey: 'home.proto_1_title',
      subtitleKey: 'home.proto_1_subtitle',
      descKey: 'home.proto_1_desc',
      imageSrc: '/images/screenshots/proto_1.avif',
      tag: 'PoC Labo',
      specs: ['Arduino Mega', 'MPU-6050'],
    },
    {
      id: 2,
      titleKey: 'home.proto_2_title',
      subtitleKey: 'home.proto_2_subtitle',
      descKey: 'home.proto_2_desc',
      anecdoteKey: 'home.proto_2_anecdote',
      imageSrc: '/images/screenshots/proto_2.avif',
      tag: 'Breadboard',
      specs: ['ESP32', 'BLE GATT'],
    },
  ];

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [HomePrototypesComponent],
      providers: [TranslationService],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePrototypesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('prototypes', mockPrototypes);
    fixture.componentRef.setInput('selectedPrototype', 0);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render prototypes selector and emit prototypeSelect on click', () => {
    expect(component).toBeTruthy();
    const selectSpy = vi.fn();
    component.prototypeSelect.subscribe(selectSpy);

    const buttons = fixture.nativeElement.querySelectorAll('#prototypes button');
    expect(buttons.length).toBe(2);

    buttons[1].click();
    expect(selectSpy).toHaveBeenCalledWith(1);
  });

  it('should auto-advance prototype every 4 seconds', () => {
    const selectSpy = vi.fn();
    component.prototypeSelect.subscribe(selectSpy);

    vi.advanceTimersByTime(4000);
    expect(selectSpy).toHaveBeenCalledWith(1);

    fixture.componentRef.setInput('selectedPrototype', 1);
    fixture.detectChanges();

    vi.advanceTimersByTime(4000);
    expect(selectSpy).toHaveBeenCalledWith(0);
  });

  it('should pause auto-advance on mouseenter and resume on mouseleave', () => {
    const selectSpy = vi.fn();
    component.prototypeSelect.subscribe(selectSpy);

    const section: HTMLElement = fixture.nativeElement.querySelector('#prototypes');
    section.dispatchEvent(new MouseEvent('mouseenter'));
    expect(component.isPaused()).toBe(true);

    vi.advanceTimersByTime(4000);
    expect(selectSpy).not.toHaveBeenCalled();

    section.dispatchEvent(new MouseEvent('mouseleave'));
    expect(component.isPaused()).toBe(false);

    vi.advanceTimersByTime(4000);
    expect(selectSpy).toHaveBeenCalledWith(1);
  });
});
