import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.375rem;
    min-width: 12rem;
    min-height: 2.5rem;
    padding: 0.375rem 0.5rem;
    border: 1px solid currentColor;
    border-radius: 0.375rem;
    background: Canvas;
    color: CanvasText;
  }
  :host(:focus-within) {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
  :host([aria-disabled='true']) {
    opacity: 0.6;
  }
  [part='chips'] {
    display: contents;
  }
  [part='chip'] {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.25rem 0.125rem 0.5rem;
    border: 1px solid color-mix(in srgb, CanvasText 25%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, CanvasText 8%, Canvas);
    white-space: nowrap;
  }
  [part='chip-remove'] {
    display: inline-grid;
    width: 1.25rem;
    height: 1.25rem;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  [part='chip-remove']:hover {
    background: color-mix(in srgb, CanvasText 18%, Canvas);
  }
  ::slotted(input[slot='input']) {
    box-sizing: border-box;
    flex: 1 1 5rem;
    min-width: 4rem;
    min-height: 1.75rem;
    padding: 0.125rem;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
  }
`;
