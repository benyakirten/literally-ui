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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .placeholder {
    opacity: 0.65;
  }
  [part='indicator'] {
    flex: none;
  }
  slot {
    display: none;
  }
`;
