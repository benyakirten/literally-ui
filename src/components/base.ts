import { LitElement } from "lit";

export class LUElement extends LitElement {
  emit<T>(name: string, data: T, options: Omit<CustomEventInit<T>, "detail">) {
    this.dispatchEvent(new CustomEvent(name, { ...options, detail: data }));
  }
}
