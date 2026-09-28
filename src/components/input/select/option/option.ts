import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { SelectOption } from '../context';

@customElement('lu-select-option')
export class LUSelectOption extends LitElement implements SelectOption {
  @property({ type: String }) value = '';
  @property({ type: String, attribute: 'display-value' }) displayValue = '';

  @query('slot') private _slot!: HTMLSlotElement;

  getValue() {
    return this.value;
  }

  getDisplayValue() {
    return this.displayValue || this._slot.textContent.trim();
  }

  render() {
    return html`<slot></slot>`;
  }
}
