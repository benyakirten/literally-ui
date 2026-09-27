import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { LUFaceElement } from '../../../face-mixin';
import styles from './select.styles';
import { type SelectContext, selectContext } from '../../context';

@customElement('lu-select')
export class LUSelect extends LUFaceElement() {
  static get styles() {
    return styles;
  }

  @consume({ context: selectContext })
  private _ctx!: SelectContext;

  @property({ type: Boolean, reflect: true }) open: boolean = false;

  @property({ type: String, reflect: true }) value: string = '';

  private _handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'DownArrow':
      case 'UpArrow':
      case 'Enter':
        this._ctx.setOpen(true);
        break;
      default:
        return;
    }
  }

  render() {
    return html`<div
        role="combobox"
        aria-haspopup=${this._ctx.popupRole}
        aria-expanded=${this._ctx.open}
        aria-controls=${this._ctx.popupId}
        .id=${this.id}
        tabindex=${0}
        @keydown=${this._handleKeydown}
      ></div>
      <slot></slot> `;
  }
}
