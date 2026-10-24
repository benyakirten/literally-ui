import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
    position: fixed;
    inset: auto;
    margin: 0;
    padding: 0.25rem 0;
    min-width: var(--lu-select-trigger-width, 8rem);
    max-width: calc(100vw - 1rem);
    max-height: min(
      var(--lu-select-popup-max-height, 300px),
      var(--lu-select-available-height, 300px)
    );
    overflow: auto;
    overscroll-behavior: contain;
    border: 1px solid color-mix(in srgb, CanvasText 25%, transparent);
    border-radius: 0.375rem;
    background: Canvas;
    color: CanvasText;
    box-shadow: 0 0.25rem 0.75rem #0003;
  }
  :host(:popover-open) {
    display: block;
  }
  :host(:focus-visible) {
    outline: 2px solid Highlight;
  }
`;
