import { LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import style from "./menu.styles";

@customElement("headless-menu")
export class HeadlessMenu extends LitElement {
  static get styles() {
    return style;
  }

  @property({ type: Boolean }) open = false;
}
