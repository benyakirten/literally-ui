import { consume } from '@lit/context';
import { html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LUFaceElement } from '../../../face-mixin';
import {
  selectContext,
  type SelectContext,
  type SelectOption,
} from '../../context';
import styles from './combobox.styles.ts';

/**
 * Searchable, form-associated select input. The native text input is managed
 * internally and kept in the light DOM so its active-descendant references to
 * sibling listbox options remain in the same tree scope.
 */
@customElement('lu-select-combobox')
export class LUSelectCombobox extends LUFaceElement() {
  static styles = styles;

  @consume({ context: selectContext, subscribe: true })
  private _ctx?: SelectContext;
  @property({ type: String, reflect: true }) name = '';
  @property({ type: String }) override value = '';
  @property({ type: Boolean, reflect: true }) multi = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) override disabled = false;
  @property({ type: String }) placeholder = 'Search options…';
  @property({ type: String }) autocomplete = 'off';
  @property({ type: String, attribute: 'inputmode' }) inputMode = '';
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ attribute: false }) values: string[] = [];

  readonly searchable = true;
  private _registered?: SelectContext;
  private _nativeInput?: HTMLInputElement;
  private _defaultValues?: string[];
  private _customValidity = '';
  private _fieldsetDisabled = false;
  private _query = '';
  private _wasOpen = false;
  private _lastSyncedValue?: string;
  private _lastSyncedValues = '[]';
  private _initiallyHidden = new WeakMap<SelectOption, boolean>();

  get focusTarget() {
    return this._nativeInput ?? this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.id ||= `lu-combobox-${crypto.randomUUID()}`;
    this.tabIndex = -1;
    this._ensureNativeInput();
  }

  protected firstUpdated() {
    this._defaultValues = this._initialValues();
    this._register();
    this._syncSelection();
    this._syncNativeInput();
    this._filterOptions();
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    this._ensureNativeInput();
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
      this._writeValues(
        this.multi ? this._values : this._values.slice(0, 1),
        false,
      );
      this._ctx?.setOpen(false);
    }

    const contextOpen = this._ctx?.open ?? false;
    if (this._wasOpen && !contextOpen) this._restoreCommittedText();
    this._wasOpen = contextOpen;
    if (this.open !== contextOpen) this.open = contextOpen;
    this.setAttribute('aria-expanded', String(contextOpen));
    this._updateValidity();
    this.setAttribute('aria-disabled', String(this._isDisabled));
    this.setAttribute('aria-invalid', String(!this.validity.valid));
    this.setAttribute('aria-required', String(this.required));
    this._syncNativeInput();
    this._filterOptions();
    this._updateFormValue();
  }

  private get _isDisabled() {
    return this.disabled || this._fieldsetDisabled;
  }

  private get _values() {
    return this._ctx ? [...this._ctx.values] : [...this.values];
  }

  private get _selectedOptions() {
    return (
      this._ctx?.options.filter((option) =>
        this._values.includes(option.value),
      ) ?? []
    );
  }

  private _ensureNativeInput() {
    if (this._nativeInput) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.slot = 'input';
    input.setAttribute('autocomplete', this.autocomplete);
    input.placeholder = this.placeholder;
    input.id = `${this.id}-input`;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-haspopup', 'listbox');
    input.addEventListener('input', this._onInput);
    input.addEventListener('keydown', this._onKeydown);
    input.addEventListener('click', this._onInputClick);
    this._nativeInput = input;
    this.append(input);
  }

  private _initialValues() {
    if (this.values.length) return [...this.values];
    return this.hasAttribute('value') || this.value !== '' ? [this.value] : [];
  }

  private _register() {
    if (!this._ctx || this._registered?.owner === this._ctx.owner) return;
    this._registered?.unregisterInput(this);
    this._registered = this._ctx;
    this._ctx.registerInput(this);
    if (this._defaultValues === undefined)
      this._defaultValues = this._initialValues();
    this._ctx.setValues(this._initialValues());
  }

  private _syncSelection() {
    this._writeValues(
      this.values.length
        ? this.values
        : this.hasAttribute('value')
          ? [this.value]
          : [],
      false,
    );
  }

  private _writeValues(values: string[], user: boolean) {
    const next = [...new Set(this.multi ? values : values.slice(0, 1))];
    const old = JSON.stringify(this._values);
    this.values = next;
    this.value = next[0] ?? '';
    this._lastSyncedValue = this.value;
    this._lastSyncedValues = JSON.stringify(next);
    this._ctx?.setValues(next);
    this._updateFormValue();
    this._updateValidity();
    if (user && old !== JSON.stringify(next)) this._emitSelectionEvents();
  }

  private _emitSelectionEvents() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  syncUserSelection() {
    const next = [...(this._ctx?.values ?? this.values)];
    const old = JSON.stringify(this.values);
    this.values = next;
    this.value = next[0] ?? '';
    this._lastSyncedValue = this.value;
    this._lastSyncedValues = JSON.stringify(next);
    if (this.multi && this._ctx?.open) {
      this._query = '';
      if (this._nativeInput) this._nativeInput.value = '';
    }
    this._syncNativeInput();
    this._filterOptions();
    this._updateFormValue();
    this._updateValidity();
    if (old !== JSON.stringify(next)) this._emitSelectionEvents();
  }

  private _syncNativeInput() {
    const input = this._nativeInput;
    if (!input) return;
    input.disabled = this._isDisabled;

    input.setAttribute('autocomplete', this.autocomplete || 'off');
    input.inputMode = this.inputMode;
    input.placeholder = this.placeholder;
    input.setAttribute('aria-expanded', String(this._ctx?.open ?? false));
    input.setAttribute('aria-required', String(this.required));
    input.setAttribute('aria-disabled', String(this._isDisabled));
    input.setAttribute('aria-invalid', String(!this.validity.valid));

    if (this._ctx?.popupId)
      input.setAttribute('aria-controls', this._ctx.popupId);
    else input.removeAttribute('aria-controls');

    const activeId = this._ctx?.open
      ? this._ctx.options.find((option) => option.id === this._ctx?.activeId)
          ?.id
      : undefined;
    if (activeId) input.setAttribute('aria-activedescendant', activeId);
    else input.removeAttribute('aria-activedescendant');
    this._syncAccessibleName(input);

    if (this._ctx?.open) input.value = this._query;
    else if (this.multi) input.value = '';
    else input.value = this._selectedOptions[0]?.getDisplayValue() ?? '';
  }

  private _syncAccessibleName(input: HTMLInputElement) {
    const ariaLabel = this.getAttribute('aria-label');
    const labelledBy = this.getAttribute('aria-labelledby');
    if (ariaLabel) {
      input.setAttribute('aria-label', ariaLabel);
      input.removeAttribute('aria-labelledby');
      return;
    }
    input.removeAttribute('aria-label');
    if (labelledBy) {
      input.setAttribute('aria-labelledby', labelledBy);
      return;
    }
    const labels = Array.from(
      this.internals.labels,
      (label) => label as HTMLLabelElement,
    );
    for (const label of labels) {
      if (!label.id) label.id = `lu-combobox-label-${crypto.randomUUID()}`;
    }
    if (labels.length) {
      const ids = labels.map((label) => label.id).join(' ');
      this.setAttribute('aria-labelledby', ids);
      input.setAttribute('aria-labelledby', ids);
    } else {
      this.removeAttribute('aria-labelledby');
      input.removeAttribute('aria-labelledby');
    }
  }

  private _filterOptions() {
    if (!this._ctx) return;
    const normalized = this._query.trim().toLocaleLowerCase();
    for (const option of this._ctx.options) {
      if (!this._initiallyHidden.has(option))
        this._initiallyHidden.set(option, option.hidden);
      const baseHidden = this._initiallyHidden.get(option) ?? false;
      const matches =
        !normalized ||
        option.getDisplayValue().toLocaleLowerCase().includes(normalized);
      option.hidden = baseHidden || !matches;
    }
    const active = this._ctx.options.find(
      (option) => option.id === this._ctx?.activeId,
    );
    if (active && (active.hidden || active.disabled))
      this._ctx.setActive(this._firstEnabledOption());
  }

  private _firstEnabledOption() {
    const normalized = this._query.trim().toLocaleLowerCase();
    return (
      this._ctx?.options.find((option) => {
        const baseHidden = this._initiallyHidden.get(option) ?? option.hidden;
        return (
          !baseHidden &&
          !option.disabled &&
          (!normalized ||
            option.getDisplayValue().toLocaleLowerCase().includes(normalized))
        );
      }) ?? null
    );
  }

  private _filteredEnabledOptions() {
    return (
      this._ctx?.options.filter(
        (option) => !option.hidden && !option.disabled,
      ) ?? []
    );
  }

  private _setOpen(open: boolean) {
    if (this._isDisabled) return;
    this._ctx?.setOpen(open);
    this.open = open;
    if (!open) this._restoreCommittedText();
  }

  private _openPopup() {
    if (this._isDisabled) return;
    this._query = '';
    this._ctx?.setOpen(true);
    this.open = true;
    const selected = this._ctx?.options.find(
      (option) =>
        this._values.includes(option.value) &&
        !option.hidden &&
        !option.disabled,
    );
    this._ctx?.setActive(selected ?? this._firstEnabledOption());
    this._filterOptions();
    this._syncNativeInput();
    this._nativeInput?.select();
  }

  private _restoreCommittedText() {
    this._query = '';
    this.open = false;
    this._ctx?.setActive(null);
    this._syncNativeInput();
    this._filterOptions();
  }

  private _onInput = () => {
    if (!this._nativeInput || this._isDisabled) return;
    this._query = this._nativeInput.value;
    this._filterOptions();
    if (!this._ctx?.open) {
      this._ctx?.setOpen(true);
      this.open = true;
    }
    if (!this._ctx?.activeId) this._ctx?.setActive(this._firstEnabledOption());
  };

  private _onInputClick = () => {
    if (!this._ctx?.open) this._openPopup();
  };

  private _moveActive(delta: number) {
    const options = this._filteredEnabledOptions();
    if (!options.length) {
      this._ctx?.setActive(null);
      return;
    }
    const current = options.findIndex(
      (option) => option.id === this._ctx?.activeId,
    );
    const nextIndex = Math.max(
      0,
      Math.min(
        options.length - 1,
        current < 0 ? (delta > 0 ? 0 : options.length - 1) : current + delta,
      ),
    );
    this._ctx?.setActive(options[nextIndex]);
  }

  private _selectActive() {
    const active = this._ctx?.options.find(
      (option) =>
        option.id === this._ctx?.activeId && !option.hidden && !option.disabled,
    );
    if (!active) return;
    this._ctx?.commit(active.value);
    this.syncUserSelection();
    if (this.multi) {
      this._query = '';
      if (this._nativeInput) this._nativeInput.value = '';
      this._filterOptions();
      this._ctx?.setActive(active);
    } else {
      this._setOpen(false);
    }
  }

  private _onKeydown = (event: KeyboardEvent) => {
    if (this._isDisabled || event.isComposing) return;
    if (!this._ctx?.open) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter'
      ) {
        event.preventDefault();
        this._openPopup();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this._setOpen(false);
    } else if (event.key === 'Tab') {
      this._setOpen(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._moveActive(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this._selectActive();
    } else if (
      this.multi &&
      event.key === 'Backspace' &&
      !this._nativeInput?.value &&
      this._values.length
    ) {
      event.preventDefault();
      this._writeValues(this._values.slice(0, -1), true);
    }
  };

  private _removeChip(event: MouseEvent, value: string) {
    event.stopPropagation();
    if (this._isDisabled) return;
    this._writeValues(
      this._values.filter((item) => item !== value),
      true,
    );
    this._nativeInput?.focus();
  }

  private _updateFormValue() {
    const values = this._values;
    const resolved = values.filter((value) =>
      this._ctx?.options.some((option) => option.value === value),
    );
    if (this._isDisabled || !this.name) {
      this.internals.setFormValue(null);
    } else if (this.multi) {
      const data = new FormData();
      resolved.forEach((value) => data.append(this.name, value));
      this.internals.setFormValue(
        data,
        JSON.stringify({ version: 1, values, multi: true }),
      );
    } else {
      this.internals.setFormValue(
        resolved.length ? resolved[0] : null,
        JSON.stringify({ version: 1, values, multi: false }),
      );
    }
  }

  private _updateValidity() {
    const hasResolvedValue = this._values.some((value) =>
      this._ctx?.options.some((option) => option.value === value),
    );
    const message =
      this._customValidity ||
      (this.required && !hasResolvedValue ? 'Please select an option.' : '');
    if (message)
      this.internals.setValidity(
        this._customValidity ? { customError: true } : { valueMissing: true },
        message,
        this,
      );
    else this.internals.setValidity({});
  }

  setCustomValidity(message: string) {
    this._customValidity = message;
    this._updateValidity();
    this._syncNativeInput();
  }

  override focus(options?: FocusOptions) {
    this._nativeInput?.focus(options);
  }

  formResetCallback() {
    this._writeValues(this._defaultValues ?? [], false);
    this._setOpen(false);
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
        parsed.values.every((value) => typeof value === 'string')
      ) {
        this._writeValues(parsed.values, false);
      }
    } catch {
      // Ignore malformed browser-restored state.
    }
  }

  formDisabledCallback(disabled: boolean) {
    this._fieldsetDisabled = disabled;
    this._syncNativeInput();
    this._ctx?.setOpen(false);
    this._updateFormValue();
  }

  disconnectedCallback() {
    this._registered?.unregisterInput(this);
    this._registered = undefined;

    super.disconnectedCallback();
  }

  render() {
    return html`<span part="chips" ?hidden=${!this.multi}>
        ${
          this.multi
            ? this._selectedOptions.map(
                (option) => html`<span part="chip">
                  <span>${option.getDisplayValue()}</span>
                  <button
                    type="button"
                    part="chip-remove"
                    aria-label=${`Remove ${option.getDisplayValue()}`}
                    @click=${(event: MouseEvent) => this._removeChip(event, option.value)}
                  >
                    ×
                  </button>
                </span>`,
              )
            : ''
        } </span
      ><slot name="input"></slot>`;
  }
}
