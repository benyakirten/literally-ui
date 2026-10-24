import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 8rem;
    min-height: 2.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 0.375rem;
    background: Canvas;
    color: CanvasText;
    cursor: pointer;
  }
  :host(:focus-visible) {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
  :host([aria-disabled='true']) {
    cursor: not-allowed;
    opacity: 0.6;
  }
  [part='value'] {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :host([multi]) {
    flex-wrap: wrap;
    justify-content: flex-start;
    min-height: 2.75rem;
    height: auto;
  }
  :host([multi]) [part='value'] {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    white-space: normal;
  }
  [part='chip'] {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    max-width: 100%;
    padding: 0.125rem 0.375rem 0.125rem 0.5rem;
    border: 1px solid color-mix(in srgb, CanvasText 25%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, CanvasText 8%, Canvas);
    white-space: nowrap;
  }
  [part='chip-remove'] {
    display: inline-grid;
    width: 1rem;
    height: 1rem;
    place-items: center;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
  }
  [part='chip-remove']:hover {
    background: color-mix(in srgb, CanvasText 18%, Canvas);
  }
  .placeholder {
    opacity: 0.65;
  }
  :host([multi]) [part='indicator'] {
    align-self: center;
    margin-inline-start: auto;
  }
  [part='indicator'] {
    flex: none;
    transition: transform 150ms ease-out;
  }
  :host([aria-expanded='true']) [part='indicator'] {
    transform: rotate(180deg);
  }
  @media (prefers-reduced-motion: reduce) {
    [part='indicator'] {
      transition: none;
    }
  }
  slot {
    display: none;
  }
`;
