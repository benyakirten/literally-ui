import type { LitElement } from 'lit';

export const SelectItemMixin = <T extends new (...args: any[]) => LitElement>(
  superClass: T,
) =>
  class extends superClass {
    //
  };

export const SelectItemMixinElement = SelecItemMixin(LitElement);
