/**
 * Global test environment setup.
 * Ensures tests run with French as default navigator.language regardless of OS locale.
 */
if (typeof navigator !== 'undefined') {
  try {
    Object.defineProperty(navigator, 'language', {
      value: 'fr-FR',
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'languages', {
      value: ['fr-FR', 'fr'],
      configurable: true,
      writable: true,
    });
  } catch {
    // Ignore in environments where navigator cannot be redefined
  }
}

