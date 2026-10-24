import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
    display: block;
    padding: var(--lu-select-option-padding, 0.5rem 0.75rem);
    cursor: default;

    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  :host([data-active]),
  :host(:hover) {
    background: Highlight;
    color: HighlightText;
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
