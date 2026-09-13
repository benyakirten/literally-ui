import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import style from "./menu-item.styles";

@customElement("headless-menu-item")
export class HeadlessMenuItem extends LitElement {
  static get styles() {
    return style;
  }
}
