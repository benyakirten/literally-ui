import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

export interface Logger {
  log: (...data: any[]) => void;
  warn: (...data: any[]) => void;
  error: (...data: any[]) => void;
}

export class LUElement extends LitElement {
  @property({ type: Object }) logger: Logger = console;
  emit<T>(name: string, data: T, options: Omit<CustomEventInit<T>, 'detail'>) {
    this.dispatchEvent(new CustomEvent(name, { ...options, detail: data }));
  }
}
