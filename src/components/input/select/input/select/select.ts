import { customElement, property, state } from 'lit/decorators.js';
import { html } from 'lit';

import { LUFaceElement } from '../../../face-mixin';
import styles from './select.styles';

@customElement('lu-select')
export class LUSelect extends LUFaceElement() {
  static get styles() {
    return styles;
  }

  @property({ type: Boolean, reflect: true }) open: boolean = false;

  @property({ type: String, reflect: true }) value: string = '';

  @state() private _popupId = '';
  @state() private _popupRole: 'listbox' | 'tree' = 'tree';

  private _numOptions: number = 0;

  private _handleSlotChange(e: Event & { target: HTMLSlotElement }) {
    const { target } = e;
    const slotChildren = target.assignedElements();
    if (slotChildren.length !== 1) {
      throw new Error('LU Select should only have one popup child');
    }

    const popup = slotChildren[0];
    const role = popup.getAttribute('role');

    if (role !== 'listbox' && role !== 'tree') {
      throw new Error('LU Select only supports listbox and tree role');
    }

    this._popupRole = role;
    this._popupId = popup.id;
  }

  setOpen(open: boolean) {
    this.open = open;
  }

  private _handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'DownArrow':
      case 'UpArrow':
      case 'Enter':
        this.setOpen(true);
      default:
        return;
    }
  }

  private _handleSelect(e: KeyboardEvent) {
    e.stopPropagation();
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
        @lu:select=${this._handleSelect}
      ></slot> `;
  }
}
