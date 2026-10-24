import { createContext, provide } from '@lit/context';
import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LUElement } from '../../base';
import styles from './context.styles';

export interface SelectOption extends HTMLElement {
  value: string;
  displayValue: string;
  disabled: boolean;
  getDisplayValue(): string;
}

export interface SelectSnapshot {
  owner: object;
  options: readonly SelectOption[];
  values: readonly string[];
  open: boolean;
  multi: boolean;
  activeId: string | null;
  popupId: string | null;
  input: HTMLElement | null;
}

export interface SelectContext extends SelectSnapshot {
  registerInput(input: HTMLElement & { multi: boolean }): void;
  unregisterInput(input: HTMLElement): void;
  registerPopup(popup: HTMLElement): void;
  unregisterPopup(popup: HTMLElement): void;
  registerOption(option: SelectOption): void;
  unregisterOption(option: SelectOption): void;
  setValues(values: string[]): void;
  setMulti(multi: boolean): void;
  setOpen(open: boolean): void;
  setActive(option: SelectOption | null): void;
  commit(value: string): void;
}

export const selectContext = createContext<SelectContext>(
  Symbol.for('lu-select-context'),
);

/** Coordinates one input, one listbox, and its options. The input is the only form control. */
@customElement('lu-select-context')
export class LUSelectContext extends LUElement {
  static styles = styles;
  @property({ type: String }) validation: 'lax' | 'log' | 'error' = 'log';
  @state() private _options: SelectOption[] = [];
  @state() private _values: string[] = [];
  @state() private _open = false;
  @state() private _multi = false;
  @state() private _activeId: string | null = null;
  @state() private _popupId: string | null = null;
  private _input: HTMLElement | null = null;
  private _popup: HTMLElement | null = null;

  @provide({ context: selectContext })
  @state()
  contextValue: SelectContext = this._snapshot();

  private _snapshot(): SelectContext {
    return {
      owner: this,
      options: this._options,
      values: this._values,
      open: this._open,
      multi: this._multi,
      activeId: this._activeId,
      popupId: this._popupId,
      input: this._input,
      registerInput: (input) => this._registerInput(input),
      unregisterInput: (input) => this._unregisterInput(input),
      registerPopup: (popup) => this._registerPopup(popup),
      unregisterPopup: (popup) => this._unregisterPopup(popup),
      registerOption: (option) => this._registerOption(option),
      unregisterOption: (option) => this._unregisterOption(option),
      setValues: (values) => this._setValues(values),
      setMulti: (multi) => this._setMulti(multi),
      setOpen: (open) => this._setOpen(open),
      setActive: (option) => this._setActive(option),
      commit: (value) => this._commit(value),
    };
  }

  private _publish() {
    this._options = [...this._options].sort((a, b) => {
      const relation = a.compareDocumentPosition(b);
      return relation & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    this.contextValue = this._snapshot();
  }

  private _diagnose(message: string, element?: HTMLElement) {
    if (this.validation === 'error') throw new Error(message);
    if (this.validation === 'log') this.logger.warn(message, element);
  }

  private _sameTree(element: HTMLElement) {
    return element.getRootNode() === this.getRootNode();
  }

  private _registerInput(input: HTMLElement & { multi: boolean }) {
    if (!this._sameTree(input)) {
      this._diagnose(
        'Select input must share a DOM tree with its context',
        input,
      );
      return;
    }
    if (this._input && this._input !== input) {
      this._diagnose('A select context supports one input', input);
      return;
    }
    this._input = input;
    this._multi = input.multi;
    if (!this._multi) this._values = this._values.slice(0, 1);
    this._publish();
  }

  private _unregisterInput(input: HTMLElement) {
    if (this._input !== input) return;
    this._input = null;
    this._open = false;
    this._publish();
  }

  private _registerPopup(popup: HTMLElement) {
    if (!this._sameTree(popup)) {
      this._diagnose(
        'Select listbox must share a DOM tree with its context',
        popup,
      );
      return;
    }
    if (this._popup && this._popup !== popup) {
      this._diagnose('A select context supports one listbox', popup);
      return;
    }
    this._popup = popup;
    this._popupId = popup.id;
    this._publish();
  }

  private _unregisterPopup(popup: HTMLElement) {
    if (this._popup !== popup) return;
    this._popup = null;
    this._popupId = null;
    this._open = false;
    this._publish();
  }

  private _registerOption(option: SelectOption) {
    if (!this._sameTree(option)) {
      this._diagnose(
        'Select option must share a DOM tree with its context',
        option,
      );
      return;
    }
    if (!option.hasAttribute('value') && option.value === '')
      this._diagnose('Select options require an explicit value', option);
    const duplicate = this._options.find(
      (existing) => existing !== option && existing.value === option.value,
    );
    if (duplicate) {
      this._diagnose(`Duplicate select option value: ${option.value}`, option);
      return;
    }
    if (!this._options.includes(option))
      this._options = [...this._options, option];
    if (option.disabled && this._activeId === option.id) this._activeId = null;
    this._publish();
  }

  private _unregisterOption(option: SelectOption) {
    this._options = this._options.filter((item) => item !== option);
    if (this._activeId === option.id) this._activeId = null;
    this._publish();
  }

  private _setValues(values: string[]) {
    const next = [...new Set(this._multi ? values : values.slice(0, 1))];
    if (
      next.length === this._values.length &&
      next.every((value, index) => value === this._values[index])
    )
      return;
    this._values = next;
    this._publish();
  }

  private _setMulti(multi: boolean) {
    if (this._multi === multi) return;
    this._multi = multi;
    if (!multi) this._values = this._values.slice(0, 1);
    this._open = false;
    this._activeId = null;
    this._publish();
  }

  private _setOpen(open: boolean) {
    const next = Boolean(
      open &&
      this._input &&
      this._popup &&
      !(this._input as HTMLInputElement).disabled,
    );
    const activeId = next ? this._activeId : null;
    if (next === this._open && activeId === this._activeId) return;
    this._open = next;
    this._activeId = activeId;
    this._publish();
  }

  private _setActive(option: SelectOption | null) {
    const next = option && !option.disabled ? option.id : null;
    if (this._activeId === next) return;
    this._activeId = next;
    this._publish();
  }

  private _commit(value: string) {
    const option = this._options.find(
      (item) => item.value === value && !item.disabled,
    );
    if (!option) return;
    const next = this._multi
      ? this._values.includes(value)
        ? this._values.filter((item) => item !== value)
        : [...this._values, value]
      : [value];
    this._setValues(next);
  }

  render() {
    return html`<slot></slot>`;
  }
}
