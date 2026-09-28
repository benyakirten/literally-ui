import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
  selectContext,
  type SelectContext,
  type SelectOption,
} from '../context';
import { consume } from '@lit/context';

@customElement('lu-select-option')
export class LUSelectOption extends LitElement implements SelectOption {
  @consume({ context: selectContext, subscribe: true })
  private _ctx!: SelectContext;

  @property({ type: String }) value = '';
  @property({ type: String, attribute: 'display-value' }) displayValue = '';

  @query('slot') private _slot!: HTMLSlotElement;

  connectedCallback() {
    this._ctx.registerOption(this);
  }

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
