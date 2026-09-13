import { LitElement, type PropertyValues } from 'lit';

type Constructor<T = {}> = new (...args: any[]) => T;
type FormableValue = string | File | FormData | null;

export interface FaceMixinInterface<V extends FormableValue = string> {
  value: V;
  disabled: boolean;
  readonly: boolean;
  readonly internals: ElementInternals;
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
}

function CreateFaceMixin<V extends FormableValue>() {
  return function <T extends Constructor<LitElement>>(superClass: T) {
    class FaceMixinClass extends superClass implements FaceMixinInterface<V> {
      static formAssociated = true;

      static properties = {
        value: { reflect: true },
        disabled: { type: Boolean, reflect: true },
        readonly: { type: Boolean, reflect: true },
      };

      value!: V;
      disabled = false;
      readonly = false;

      protected _internals: ElementInternals;
      private _initialValue!: V;

      constructor(...args: any[]) {
        super(...args);
        this._internals = this.attachInternals();
      }

      connectedCallback(): void {
        super.connectedCallback();
        this._initialValue = this.value;
      }

      get internals(): ElementInternals {
        return this._internals;
      }

      get form(): HTMLFormElement | null {
        return this._internals.form;
      }

      get validity(): ValidityState {
        return this._internals.validity;
      }

      get validationMessage(): string {
        return this._internals.validationMessage;
      }

      get willValidate(): boolean {
        return this._internals.willValidate;
      }

      checkValidity(): boolean {
        return this._internals.checkValidity();
      }

      reportValidity(): boolean {
        return this._internals.reportValidity();
      }

      protected setValidity(
        flags?: ValidityStateFlags,
        message?: string,
        anchor?: HTMLElement,
      ): void {
        this._internals.setValidity(flags, message, anchor);
      }

      protected setFormValue(value: V, state?: V): void {
        this._internals.setFormValue(value, state);
      }

      formAssociatedCallback(_form: HTMLFormElement | null): void {}

      formResetCallback(): void {
        this.value = this._initialValue;
      }

      formDisabledCallback(disabled: boolean): void {
        this.disabled = disabled;
      }

      formStateRestoreCallback(
        state: V,
        _reason: 'restore' | 'autocomplete',
      ): void {
        if (state !== null) {
          this.value = state;
        }
      }

      protected updated(changedProperties: PropertyValues<this>): void {
        super.updated(changedProperties);
        if (changedProperties.has('value')) {
          this.setFormValue(this.value);
        }
      }
    }

    return FaceMixinClass as unknown as Constructor<FaceMixinInterface<V>> & T;
  };
}

export function FaceMixin<
  SuperClass extends Constructor<LitElement>,
  Value extends FormableValue = string,
>(superClass: SuperClass) {
  return CreateFaceMixin<Value>()(superClass);
}

export function LitFaceElement<Value extends FormableValue = string>() {
  return FaceMixin<Constructor<LitElement>, Value>(LitElement);
}
