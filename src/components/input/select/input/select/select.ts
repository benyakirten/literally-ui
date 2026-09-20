import { customElement, property } from 'lit/decorators.js';
import { html } from 'lit';

import { LUFaceElement } from '../../../face-mixin';
import styles from './select.styles';

@customElement('lu-select')
export class LUSelect extends LUFaceElement() {
  static get styles() {
    return styles;
  }

  @property({ type: Boolean, reflect: true })
  open: boolean = false;

  private _popupId = '';
  private _popupRole: 'listbox' | 'tree' = 'tree';

  private _handleSlotChange(e: Event & { target: HTMLSlotElement }) {
    const { target } = e;
    const role = target.getAttribute('role');
    if (role !== 'listbox' && role !== 'tree') {
      throw new Error('LU Select only supports listbox and tree role');
    }

    // TODO: Investigate and maybe switch to context
    this._popupRole = role;
    this._popupId = target.id;
  }

  private _handleKeydown(_e: KeyboardEvent) {
    //
  }

  render() {
    return html`<div
        role="combobox"
        aria-haspopup=${this._popupRole}
        aria-expanded=${this.open}
        aria-controls=${this._popupId}
        .id=${this.id}
        tabindex=${0}
        @keydown=${this._handleKeydown}
      ></div>
      <slot
        name="option-container"
        @slotchange=${this._handleSlotChange}
      ></slot> `;
  }
}
