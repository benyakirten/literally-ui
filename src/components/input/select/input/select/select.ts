import { consume } from '@lit/context';
import { html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { LUFaceElement } from '../../../face-mixin';
import {
  selectContext,
  type SelectContext,
  type SelectOption,
} from '../../context';
import styles from './select.styles';

/**
 * FACE select trigger. This is the sole form control; place it and its listbox
 * under one lu-select-context. In multi mode it is a button opening a multiselect listbox.
 */
@customElement('lu-select-input')
export class LUSelectInput extends LUFaceElement() {
  static styles = styles;

  @consume({ context: selectContext, subscribe: true })
  private _ctx?: SelectContext;
  @property({ type: String, reflect: true }) name = '';
  @property({ type: String }) override value = '';
  @property({ type: Boolean, reflect: true }) multi = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) override disabled = false;
  @property({ type: String }) placeholder = 'Select…';
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ attribute: false }) values: string[] = [];
  private _registered?: SelectContext;
  private _defaultValues?: string[];
  private _customValidity = '';
  private _fieldsetDisabled = false;
  private _syncing = false;
  private _typeBuffer = '';
  private _typeTimer?: ReturnType<typeof setTimeout>;
  private _lastSyncedValue?: string;
  private _lastSyncedValues = '[]';

  connectedCallback() {
    super.connectedCallback();
    this.id ||= `lu-select-${crypto.randomUUID()}`;
    this.tabIndex = this.disabled ? -1 : 0;
    this.addEventListener('keydown', this._onKeydown);
    this.addEventListener('click', this._onClick);
  }

  protected firstUpdated() {
    this._defaultValues = this._initialValues();
    this.setAttribute('aria-haspopup', 'listbox');
    this._register();
    this._syncSelection();
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);

    this.setAttribute('role', this.multi ? 'button' : 'combobox');

    this.setAttribute('aria-expanded', String(this._ctx?.open ?? false));

    this._syncAccessibleName();

    if (this._ctx?.popupId)
      this.setAttribute('aria-controls', this._ctx.popupId);
    else this.removeAttribute('aria-controls');
    const activeId =
      !this.multi && this._ctx?.open
        ? this._ctx.options.find((option) => option.id === this._ctx?.activeId)
            ?.id
        : undefined;
    if (activeId) this.setAttribute('aria-activedescendant', activeId);
    else this.removeAttribute('aria-activedescendant');
    this._register();
    if (changed.has('open')) this._ctx?.setOpen(this.open);
    if (
      changed.has('values') &&
      JSON.stringify(this.values) !== this._lastSyncedValues
    ) {
      this._writeValues(this.values, false);
    } else if (
      changed.has('value') &&
      this._lastSyncedValue !== undefined &&
      this.value !== this._lastSyncedValue
    ) {
      this._writeValues([this.value], false);
    } else if (
      this._lastSyncedValue === undefined &&
      this.hasAttribute('value')
    ) {
      this._syncSelection();
    }
    if (changed.has('multi')) {
      this._ctx?.setMulti(this.multi);
      const normalized = this.multi ? this._values : this._values.slice(0, 1);
      this._writeValues(normalized, false);
      this._ctx?.setOpen(false);
    }
    const actualOpen = this._ctx?.open ?? false;
    if (this.open !== actualOpen) this.open = actualOpen;
    this.tabIndex = this.disabled || this._fieldsetDisabled ? -1 : 0;
    this.setAttribute(
      'aria-disabled',
      String(this.disabled || this._fieldsetDisabled),
    );
    this._updateValidity();
    this._updateFormValue();
  }

  private get _values() {
    return this._ctx ? [...this._ctx.values] : [...this.values];
  }

  private _initialValues() {
    if (this.values.length) return [...this.values];
    return this.hasAttribute('value') || this.value !== '' ? [this.value] : [];
  }

  private _register() {
    if (this._ctx && this._registered?.owner !== this._ctx.owner) {
      this._registered?.unregisterInput(this);
      this._registered = this._ctx;
      this._ctx.registerInput(this);
      if (this._defaultValues === undefined)
        this._defaultValues = this._initialValues();
      this._ctx.setValues(this._initialValues());
    }
  }

  private _syncSelection() {
    if (this._syncing) return;
    const next = this.values.length
      ? this.values
      : this.hasAttribute('value')
        ? [this.value]
        : [];
    this._writeValues(next, false);
  }

  private _writeValues(values: string[], user: boolean) {
    const next = [...new Set(this.multi ? values : values.slice(0, 1))];
    const old = JSON.stringify(this._values);
    this._syncing = true;
    this.values = next;
    this.value = next[0] ?? '';
    this._lastSyncedValue = this.value;
    this._lastSyncedValues = JSON.stringify(next);
    this._ctx?.setValues(next);
    this._syncing = false;
    this._updateFormValue();
    this._updateValidity();
    if (user && old !== JSON.stringify(next)) {
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }

  syncUserSelection() {
    const next = [...(this._ctx?.values ?? this.values)];
    const old = JSON.stringify(this.values);
    this._syncing = true;
    this.values = next;
    this.value = next[0] ?? '';
    this._lastSyncedValue = this.value;
    this._lastSyncedValues = JSON.stringify(next);
    this._syncing = false;
    this._updateFormValue();
    this._updateValidity();
    if (old !== JSON.stringify(next)) {
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }

  private _updateFormValue() {
    const values = this._values;
    const resolved = values.filter((value) =>
      this._ctx?.options.some((option) => option.value === value),
    );
    if (this.disabled || this._fieldsetDisabled || !this.name) {
      this.internals.setFormValue(null);
    } else if (this.multi) {
      const formData = new FormData();
      resolved.forEach((item) => formData.append(this.name, item));
      this.internals.setFormValue(
        formData,
        JSON.stringify({ version: 1, values, multi: true }),
      );
    } else {
      this.internals.setFormValue(
        resolved.length ? resolved[0] : null,
        JSON.stringify({ version: 1, values, multi: false }),
      );
    }
  }

  private _syncAccessibleName() {
    if (this.hasAttribute('aria-label') || this.hasAttribute('aria-labelledby'))
      return;

    const labels = Array.from(
      this.internals.labels,
      (label) => label as HTMLLabelElement,
    );
    if (!labels.length) return;

    for (const label of labels) {
      if (!label.id) label.id = `lu-select-label-${crypto.randomUUID()}`;
    }
    this.setAttribute(
      'aria-labelledby',
      labels.map((label) => label.id).join(' '),
    );
  }

  private _updateValidity() {
    const selected = this._values.some((value) =>
      this._ctx?.options.some((option) => option.value === value),
    );
    const message =
      this._customValidity ||
      (this.required && !selected ? 'Please select an option.' : '');
    if (message)
      this.internals.setValidity(
        this._customValidity ? { customError: true } : { valueMissing: true },
        message,
        this,
      );
    else this.internals.setValidity({});
    this.setAttribute('aria-invalid', String(Boolean(message)));
    this.setAttribute('aria-required', String(this.required && !this.multi));
  }

  setCustomValidity(message: string) {
    this._customValidity = message;
    this._updateValidity();
  }

  show() {
    this._openPopup();
  }

  hide() {
    this._close(false, false);
  }

  formResetCallback() {
    this._writeValues(this._defaultValues ?? [], false);
    this._ctx?.setOpen(false);
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    if (typeof state !== 'string') return;
    try {
      const parsed = JSON.parse(state) as {
        version?: number;
        values?: unknown;
      };
      if (
        parsed.version === 1 &&
        Array.isArray(parsed.values) &&
        parsed.values.every((v) => typeof v === 'string')
      ) {
        this._writeValues(parsed.values, false);
      }
    } catch {
      // Ignore malformed browser-restored state.
    }
  }

  formDisabledCallback(disabled: boolean) {
    this._fieldsetDisabled = disabled;
    this.tabIndex = disabled || this.disabled ? -1 : 0;
    this._ctx?.setOpen(false);
    this._updateFormValue();
  }

  private _enabledOptions() {
    return (this._ctx?.options ?? []).filter((option) => !option.disabled);
  }

  private _activate(option: SelectOption | undefined) {
    if (!option) return;
    this._ctx?.setActive(option);
  }

  private _openPopup(direction: 'first' | 'last' | 'selected' = 'selected') {
    if (this.disabled || this._fieldsetDisabled) return;
    this._ctx?.setOpen(true);
    this.open = true;
    const options = this._enabledOptions();
    const selected = options.find((option) =>
      this._values.includes(option.value),
    );
    this._activate(
      direction === 'first'
        ? options[0]
        : direction === 'last'
          ? options.at(-1)
          : (selected ?? options[0]),
    );
    if (this.multi)
      queueMicrotask(
        () =>
          this._ctx?.popupId &&
          (this.getRootNode() as ParentNode)
            .querySelector?.<HTMLElement>(`#${CSS.escape(this._ctx.popupId)}`)
            ?.focus(),
      );
  }

  private _close(commit = false, restoreFocus = false) {
    if (commit && !this.multi && this._ctx?.activeId) {
      const option = this._ctx.options.find(
        (item) => item.id === this._ctx?.activeId,
      );
      if (option) this._writeValues([option.value], true);
    }
    this._ctx?.setOpen(false);
    this.open = false;
    if (restoreFocus) this.focus();
  }

  private _move(delta: number) {
    const options = this._enabledOptions();
    if (!options.length) return;
    const current = options.findIndex(
      (option) => option.id === this._ctx?.activeId,
    );
    this._activate(
      options[
        Math.max(
          0,
          Math.min(
            options.length - 1,
            current < 0
              ? delta > 0
                ? 0
                : options.length - 1
              : current + delta,
          ),
        )
      ],
    );
  }

  private _typeahead(key: string) {
    this._typeBuffer += key.toLocaleLowerCase();
    clearTimeout(this._typeTimer);
    this._typeTimer = setTimeout(() => (this._typeBuffer = ''), 700);
    const options = this._enabledOptions();
    const start = options.findIndex(
      (option) => option.id === this._ctx?.activeId,
    );
    for (let offset = 1; offset <= options.length; offset++) {
      const option =
        options[(start + offset + options.length) % options.length];
      if (
        option
          .getDisplayValue()
          .toLocaleLowerCase()
          .startsWith(this._typeBuffer)
      ) {
        this._activate(option);
        return;
      }
    }
  }

  private _onKeydown = (event: KeyboardEvent) => {
    if (this.disabled || this._fieldsetDisabled || event.isComposing) return;
    if (!this._ctx?.open) {
      if (this.multi && event.key === 'Backspace' && this._values.length) {
        event.preventDefault();
        this._writeValues(this._values.slice(0, -1), true);
        return;
      }
      if (
        ['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(
          event.key,
        )
      ) {
        event.preventDefault();
        this._openPopup(
          event.key === 'Home'
            ? 'first'
            : event.key === 'End'
              ? 'last'
              : 'selected',
        );
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this._close(false, this.multi);
    } else if (!this.multi && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this._close(true, false);
    } else if (event.altKey && event.key === 'ArrowUp') {
      event.preventDefault();
      this._close(true, this.multi);
    } else if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
    } else if (event.key === 'Tab') {
      if (!this.multi) this._close(true, false);
      else {
        this.focus({ preventScroll: true });
        this._close(false, false);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this._activate(this._enabledOptions()[0]);
    } else if (event.key === 'End') {
      event.preventDefault();
      this._activate(this._enabledOptions().at(-1));
    } else if (this.multi && event.key === ' ') {
      event.preventDefault();
      const active = this._ctx.options.find(
        (option) => option.id === this._ctx?.activeId,
      );
      if (active) {
        this._ctx.commit(active.value);
        this.syncUserSelection();
      }
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      this._typeahead(event.key);
    }
  };

  disconnectedCallback() {
    clearTimeout(this._typeTimer);
    this._registered?.unregisterInput(this);
    this._registered = undefined;
    this.removeEventListener('keydown', this._onKeydown);
    this.removeEventListener('click', this._onClick);
    super.disconnectedCallback();
  }

  private _removeChip = (event: MouseEvent, value: string) => {
    event.stopPropagation();
    if (this.disabled || this._fieldsetDisabled) return;
    this._writeValues(
      this._values.filter((item) => item !== value),
      true,
    );
  };

  private _onClick = () => {
    if (this.disabled || this._fieldsetDisabled) return;
    if (this._ctx?.open) this._close(false, this.multi);
    else this._openPopup();
  };

  render() {
    const selected =
      this._ctx?.options.filter((option) =>
        this._values.includes(option.value),
      ) ?? [];
    const hasSelection = selected.length > 0;
    const label = this.multi
      ? selected.map((option) => option.getDisplayValue()).join(', ')
      : selected[0]?.getDisplayValue();

    return html`<span
        part="value"
        class=${hasSelection ? '' : 'placeholder'}
        aria-live=${this.multi ? 'polite' : 'off'}
        >${
          this.multi && hasSelection
            ? selected.map(
                (option) => html`<span
                  part="chip"
                  aria-label=${option.getDisplayValue()}
                  ><span>${option.getDisplayValue()}</span
                  ><span
                    part="chip-remove"
                    aria-hidden="true"
                    @click=${(event: MouseEvent) =>
                      this._removeChip(event, option.value)}
                    >×</span
                  ></span
                >`,
              )
            : hasSelection
              ? label
              : this.placeholder
        }</span
      ><span part="indicator" aria-hidden="true">▾</span> <slot hidden></slot>`;
  }
}
