import { consume } from '@lit/context';
import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  selectContext,
  type SelectContext,
  type SelectOption,
} from '../context';
import styles from './option.styles.ts';

/** An option in a sibling lu-select-listbox. Values must be unique per context. */
@customElement('lu-select-option')
export class LUSelectOption extends LitElement implements SelectOption {
  static styles = styles;

  @consume({ context: selectContext, subscribe: true })
  private _ctx?: SelectContext;
  @property({ type: String, reflect: true }) value = '';
  @property({ type: String, attribute: 'display-value' }) displayValue = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  private _registered?: SelectContext;

  connectedCallback() {
    super.connectedCallback();
    this.id ||= `lu-option-${crypto.randomUUID()}`;
    this.setAttribute('role', 'option');
    this.setAttribute('aria-selected', 'false');
  }

  protected firstUpdated() {
    this._register();
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (
      changed.has('value') ||
      changed.has('displayValue') ||
      changed.has('disabled')
    ) {
      this._ctx?.registerOption(this);
    }
    this.setAttribute('aria-disabled', String(this.disabled));
    this.setAttribute(
      'aria-selected',
      String(this._ctx?.values.includes(this.value) ?? false),
    );
    this.toggleAttribute(
      'data-selected',
      this._ctx?.values.includes(this.value) ?? false,
    );
    this.toggleAttribute('data-active', this._ctx?.activeId === this.id);
    this.tabIndex = -1;
  }

  private _register() {
    if (this._ctx && this._registered?.owner !== this._ctx.owner) {
      this._registered?.unregisterOption(this);
      this._registered = this._ctx;
      this._ctx.registerOption(this);
    }
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this._register();
  }

  disconnectedCallback() {
    this._registered?.unregisterOption(this);
    this._registered = undefined;
    super.disconnectedCallback();
  }

  getDisplayValue() {
    return (this.displayValue || this.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  render() {
    return html`<slot
      @slotchange=${() => this._ctx?.registerOption(this)}
    ></slot>`;
  }
}
