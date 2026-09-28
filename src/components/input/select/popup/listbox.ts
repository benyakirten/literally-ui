import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { selectContext, type SelectContext } from '../context';
import { consume } from '@lit/context';

@customElement('lu-listbox')
export class LUListbox extends LitElement {
  @consume({ context: selectContext }) private _ctx!: SelectContext;

  @property({ type: String }) id = crypto.randomUUID();

  readonly popupRole = 'listbox';

  connectedCallback(): void {
    this.setAttribute('role', this.popupRole);
  }

  protected update(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('id')) {
      this._ctx.registerPopup(this);
    }
  }

  render() {
    return html` <slot></slot> `;
  }
}
