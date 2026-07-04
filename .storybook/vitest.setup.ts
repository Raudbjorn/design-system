import { setProjectAnnotations } from '@storybook/svelte-vite';
import * as a11yAnnotations from '@storybook/addon-a11y/preview';
import * as projectAnnotations from './preview';

// Apply the project's preview annotations (theme decorator, parameters, tags)
// when stories run as Vitest tests — the same config Storybook itself uses.
// An explicit file (rather than the addon's auto-provisioning) matches the
// Argos SDK's own e2e setup; the auto-injected module 404s under this
// pnpm + browser-mode combination.
setProjectAnnotations([
  a11yAnnotations,
  projectAnnotations,
  {
    parameters: {
      // Test-run-only capture viewport. addon-vitest resizes the tester iframe
      // to parameters.viewport before every story (defaulting to 1200×900),
      // overriding any Vitest browser.viewport config. Argos screenshots the
      // iframe's body at 2× zoom, and pixels beyond the iframe rasterize as
      // blank — so the height must exceed the tallest story at that zoom.
      viewport: {
        viewports: {
          argosCapture: {
            name: 'Argos capture',
            styles: { width: '1200px', height: '3200px' }
          }
        },
        defaultViewport: 'argosCapture'
      }
    }
  }
]);
