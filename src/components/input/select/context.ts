import { createContext, provide } from '@lit/context';
import { customElement, property, state } from 'lit/decorators.js';
import { LUElement } from '../../base';

type SelectListboxRole = 'listbox' | 'tree';

// TODO: Determine if this context is actually useful
// This seems like a lot of things to keep in the context.
// But if we use individual listeners and particular behavior
// is a context a good way to handle state management?
export type SelectContext = {
  options: HTMLElement[];
  open: boolean;
  value: string;
  highlighted: string;
  popupId: string;
  popupRole: SelectListboxRole;
  registerPopup: (val: HTMLElement) => void;
  registerOption: (o: SelectOption) => void;
  registerOptions: (opts: SelectOption[]) => void;
  highlight: (idx: string) => void;
  select: (value: string) => void;
  setOpen: (state: boolean) => void;
};

export const selectContext = createContext<SelectContext>(
  Symbol.for('lu-select-context'),
);

export type SelectOption = HTMLElement & {
  getValue: () => string;
};

type ValidationLevel = 'lax' | 'log' | 'error';

/**
 * This is a context that should wrap every select (input, popup and options).
 */
@customElement('lu-select-context')
export class LUSelectContext extends LUElement {
  /**
   * Validation level of the
   */
  @property({ type: String }) validation: ValidationLevel = 'log';

  @state() private _isOpen = false;
  @state() private _popupId = '';
  @state() private _popupRole: 'listbox' | 'tree' = 'listbox';
  @state() private _value = '';
  @state() private _highlighted: string = '';
  @state() private _options: SelectOption[] = [];

  @provide({ context: selectContext })
  contextValue: SelectContext = {
    options: this._options,
    open: this._isOpen,
    value: this._value,
    highlighted: this._highlighted,
    popupId: this._popupId,
    popupRole: this._popupRole,
    registerPopup: (el: HTMLElement) => this._handleRegisterPopup(el),
    registerOption: (o: SelectOption) => this._handleRegisterOption(o),
    registerOptions: (opts: SelectOption[]) =>
      this._handleRegisterOptions(opts),
    highlight: (value: string) => this._handleHighlight(value),
    select: (value: string) => this._handleSelectOption(value),
    setOpen: (state: boolean) => this._setOpen(state),
  };

  private _handleRegisterOptions(opts: SelectOption[]) {
    if (this.validation !== 'lax') {
      const seen = new Set<string>();
      const duplicated: string[] = [];
      for (const opt of opts) {
        if (seen.has(opt.getValue())) {
          if (this.validation === 'error') {
            throw Error(
              `Cannot register ${opt.getValue()}; already exists as option`,
            );
          } else {
            duplicated.push(opt.getValue());
          }
        }

        this.logger.warn(
          `${duplicated.length} options with identical values detected: ${duplicated}`,
        );
      }
    }

    this._options = opts;
  }

  private _handleRegisterOption(o: SelectOption) {
    if (this.validation !== 'lax') {
      if (this._options.some((opt) => opt.getValue === o.getValue)) {
        if (this.validation === 'log') {
          this.logger.warn(`${o.getValue()}; already exists as option`, o);
        } else {
          throw Error(
            `Cannot register ${o.getValue()}; already exists as option`,
          );
        }
      }
    }
    this._options.push(o);
  }

  private _isOption(value: string): boolean {
    return this._options.some((opt) => opt.getValue() === value);
  }

  private _handleSelectOption(value: string) {
    if (!this._isOption(value)) {
      return;
    }

    this._value = value;
  }

  private _setOpen(state: boolean) {
    this._isOpen = state;
  }

  private _handleHighlight(value: string) {
    if (!this._isOption(value)) {
      return;
    }
    this._highlighted = value;
  }

  private _handleRegisterPopup(el: HTMLElement) {
    const role = el.getAttribute('role');
    if (role !== 'listbox' && role !== 'tree') {
      throw new Error('LU Select only supports listbox and tree role');
    }

    const id = el.getAttribute('id');
    if (!id) {
      throw new Error('LU Select Popup must have an id');
    }

    this._popupId = id;
    this._popupRole = role;
  }
}
