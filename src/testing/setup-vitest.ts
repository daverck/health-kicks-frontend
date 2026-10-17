import '@analogjs/vite-plugin-angular/setup-vitest';
import { expect, vi } from 'vitest';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import './test-setup';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Mock DOM APIs in JSDOM
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as any;
}

if (typeof navigator !== 'undefined' && !navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: () => Promise.resolve(),
      readText: () => Promise.resolve(''),
    },
    configurable: true,
    writable: true,
  });
}

if (typeof HTMLAnchorElement !== 'undefined') {
  HTMLAnchorElement.prototype.click = () => {};
}

if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:mock-url';
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = () => {};
}

// Mock HTMLCanvasElement.getContext for Chart.js in JSDOM
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (this: any, contextId: string) {
    if (contextId === '2d') {
      return {
        canvas: this,
        fillRect: () => {},
        clearRect: () => {},
        getImageData: (x: number, y: number, w: number, h: number) => ({ data: new Array(w * h * 4) }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        resetTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
        measureText: () => ({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createPattern: () => null,
      } as any;
    }
    return null;
  } as any;
}

// Jasmine spy wrapper that adds `.and` and `.calls` chaining support
function makeJasmineSpy(initialImpl?: (...args: any[]) => any) {
  const fn = initialImpl ? vi.fn(initialImpl) : vi.fn();
  (fn as any).and = {
    returnValue: (val: any) => {
      fn.mockReturnValue(val);
      return fn;
    },
    returnValues: (...vals: any[]) => {
      vals.forEach((v) => fn.mockReturnValueOnce(v));
      return fn;
    },
    callFake: (fakeFn: any) => {
      fn.mockImplementation(fakeFn);
      return fn;
    },
    callThrough: () => fn,
    stub: () => {
      fn.mockImplementation(() => undefined);
      return fn;
    },
  };
  (fn as any).calls = {
    reset: () => {
      fn.mockClear();
    },
    count: () => fn.mock.calls.length,
    any: () => fn.mock.calls.length > 0,
    all: () => fn.mock.calls.map((args) => ({ args })),
    mostRecent: () => {
      const last = fn.mock.calls[fn.mock.calls.length - 1];
      return last ? { args: last } : undefined;
    },
  };
  return fn;
}

// Jasmine global shims for Vitest
const jasmineShim = {
  createSpy: (_name?: string, initialImpl?: any) => makeJasmineSpy(initialImpl),
  createSpyObj: (baseName: string | any, methodNames?: any, propertyNames?: any) => {
    let methods: string[] = [];
    let properties: Record<string, any> = {};

    if (Array.isArray(baseName)) {
      methods = baseName;
    } else if (Array.isArray(methodNames)) {
      methods = methodNames;
      if (propertyNames && typeof propertyNames === 'object') {
        properties = propertyNames;
      }
    } else if (typeof methodNames === 'object' && methodNames !== null) {
      properties = methodNames;
    }

    const obj: Record<string, any> = {};
    for (const m of methods) {
      obj[m] = makeJasmineSpy();
    }
    for (const [k, v] of Object.entries(properties)) {
      obj[k] = v;
    }
    return obj;
  },
  any: (expectedClass: any) => ({
    asymmetricMatch: (actual: any) =>
      actual instanceof expectedClass ||
      (expectedClass === String && typeof actual === 'string') ||
      (expectedClass === Number && typeof actual === 'number') ||
      (expectedClass === Boolean && typeof actual === 'boolean'),
  }),
  objectContaining: (expected: any) => expect.objectContaining(expected),
  stringMatching: (expected: string | RegExp) => expect.stringMatching(expected),
};

(globalThis as any).jasmine = jasmineShim;
(globalThis as any).spyOn = (obj: any, method: string) => {
  const spy = vi.spyOn(obj, method);
  (spy as any).and = {
    returnValue: (val: any) => {
      spy.mockReturnValue(val);
      return spy;
    },
    returnValues: (...vals: any[]) => {
      vals.forEach((v) => spy.mockReturnValueOnce(v));
      return spy;
    },
    callFake: (fakeFn: any) => {
      spy.mockImplementation(fakeFn);
      return spy;
    },
    callThrough: () => spy,
    stub: () => {
      spy.mockImplementation(() => undefined);
      return spy;
    },
  };
  (spy as any).calls = {
    reset: () => {
      spy.mockClear();
    },
    count: () => spy.mock.calls.length,
    any: () => spy.mock.calls.length > 0,
    all: () => spy.mock.calls.map((args) => ({ args })),
    mostRecent: () => {
      const last = spy.mock.calls[spy.mock.calls.length - 1];
      return last ? { args: last } : undefined;
    },
  };
  return spy;
};

// Jasmine compatibility matchers for Vitest
expect.extend({
  toBeTrue(received: unknown) {
    const pass = received === true;
    return {
      pass,
      message: () => `expected ${received} to be true`,
    };
  },
  toBeFalse(received: unknown) {
    const pass = received === false;
    return {
      pass,
      message: () => `expected ${received} to be false`,
    };
  },
});
