import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { consume } from '@lit/context';

import { LUFaceElement } from '../../../face-mixin';
import { type SelectContext, selectContext } from '../../context';
import styles from './select.styles';

@customElement('lu-select')
export class LUSelect extends LUFaceElement() {
  static get styles() {
    return styles;
  }

  @consume({ context: selectContext, subscribe: true })
  private _ctx!: SelectContext;

  @property({ type: Boolean, reflect: true }) open: boolean = false;
  @property({ type: String, reflect: true }) value: string = '';
  @property({ type: Boolean, reflect: true }) multi: boolean = false;

  connectedCallback() {
    this._ctx.registerInput(this);
  }

  private _highlightIndex(idx: number) {
    const opt = this._ctx.options.at(idx);
    if (!opt) {
      return;
    }

    const val = opt.getValue();
    this._ctx.highlight(val);
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (this._ctx.open) {
      return;
    }

    switch (e.key) {
      case 'DownArrow':
      case 'UpArrow':
      case 'Enter':
      case 'Home':
      case 'End':
        this._ctx.setOpen(true);
        this._highlightIndex(0);
        break;
      default:
        return;
    }
  }

  private get _activeOptionId() {
    if (!this._ctx.highlighted) {
      return;
    }

    const highlighted = this._ctx.options.find(
      (o) => o.getValue() === this._ctx.highlighted,
    );
    if (!highlighted) {
      return;
    }

    return highlighted.id;
  }

  render() {
    return html`<div
        role="combobox"
        aria-haspopup=${this._ctx.popupRole}
        aria-expanded=${this._ctx.open}
        aria-controls=${this._ctx.popupId}
        aria-activedescendant=${ifDefined(this._activeOptionId)}
        .id=${this.id}
        tabindex=${0}
        @keydown=${this._handleKeydown}
      ></div>
      <slot></slot>`;
  }
}
