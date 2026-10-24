import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
    display: block;
    padding: var(--lu-select-option-padding, 0.5rem 0.75rem);
    cursor: default;
  }
  :host([data-active]),
  :host(:hover) {
    background: Highlight;
    color: HighlightText;
  }
  :host([data-selected]) {
    font-weight: 600;
  }
  :host([aria-disabled='true']) {
    opacity: 0.55;
  }
  @media (forced-colors: active) {
    :host([data-active]) {
      outline: 1px solid Highlight;
    }
  }
`;
