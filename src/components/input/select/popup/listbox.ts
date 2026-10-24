import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { selectContext, type SelectContext } from '../context';
import styles from './listbox.styles.ts';

/** Listbox popup. Keep this host and its options in the same tree as its input. */
@customElement('lu-select-listbox')
export class LUSelectListbox extends LitElement {
  static styles = styles;
  @consume({ context: selectContext, subscribe: true })
  private _ctx?: SelectContext;
  private _registered?: SelectContext;
  private _typeBuffer = '';
  private _typeTimer?: ReturnType<typeof setTimeout>;
  private _positionFrame = 0;
  private _schedulePosition = () => {
    cancelAnimationFrame(this._positionFrame);
    this._positionFrame = requestAnimationFrame(() => this._position());
  };
  private _outside = (event: Event) => {
    const path = event.composedPath();
    if (
      path.includes(this) ||
      (this._ctx?.input && path.includes(this._ctx.input))
    )
      return;
    this._ctx?.setOpen(false);
  };

  connectedCallback() {
    super.connectedCallback();
    this.id ||= `lu-listbox-${crypto.randomUUID()}`;
    this.setAttribute('role', 'listbox');
    this.setAttribute('popover', 'manual');
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeydown);
  }

  protected firstUpdated() {
    this._register();
  }
  protected updated() {
    this._register();
    this.setAttribute(
      'aria-multiselectable',
      String(this._ctx?.multi ?? false),
    );
    const input = this._input();
    if (
      input &&
      !this.hasAttribute('aria-label') &&
      !this.hasAttribute('aria-labelledby')
    ) {
      const label = input.getAttribute('aria-label');
      const labelledBy = input.getAttribute('aria-labelledby');
      if (label) this.setAttribute('aria-label', label);
      else this.setAttribute('aria-labelledby', labelledBy || input.id);
    }
    if (this._ctx?.activeId) {
      this._ctx.options
        .find((option) => option.id === this._ctx?.activeId)
        ?.scrollIntoView({ block: 'nearest' });
    }
    this.setAttribute(
      'aria-required',
      String(
        Boolean(this._ctx?.multi && this._input()?.hasAttribute('required')),
      ),
    );
    const activeId =
      this._ctx?.multi && this._ctx.open ? this._ctx.activeId : null;
    if (activeId) this.setAttribute('aria-activedescendant', activeId);
    else this.removeAttribute('aria-activedescendant');
    this.tabIndex = -1;
    if (this._ctx?.open && !this.matches(':popover-open')) {
      try {
        this.showPopover();
      } catch {
        /* Detached or unsupported browser; state remains safe. */
      }
    } else if (!this._ctx?.open && this.matches(':popover-open')) {
      try {
        this.hidePopover();
      } catch {
        /* Already closed. */
      }
    }
    if (this._ctx?.open) {
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('focusin', this._outside, true);
      window.addEventListener('resize', this._schedulePosition);
      window.addEventListener('scroll', this._schedulePosition, true);
    } else {
      document.removeEventListener('pointerdown', this._outside, true);
      document.removeEventListener('focusin', this._outside, true);
      window.removeEventListener('resize', this._schedulePosition);
      window.removeEventListener('scroll', this._schedulePosition, true);
    }
    this._position();
  }

  private _input() {
    return this._ctx?.input ?? null;
  }

  private _position() {
    if (!this._ctx?.open) return;
    const input = this._input();
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const below = innerHeight - rect.bottom;
    const above = rect.top;
    const placeAbove = below < 180 && above > below;
    this.style.setProperty('--lu-select-trigger-width', `${rect.width}px`);
    this.style.setProperty(
      '--lu-select-available-height',
      `${Math.max(80, (placeAbove ? above : below) - 8)}px`,
    );
    this.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - rect.width - 8))}px`;
    this.style.top = `${placeAbove ? Math.max(8, rect.top - Math.min(300, above - 8)) : rect.bottom + 4}px`;
  }

  private _register() {
    if (this._ctx && this._registered?.owner !== this._ctx.owner) {
      this._registered?.unregisterPopup(this);
      this._registered = this._ctx;
      this._ctx.registerPopup(this);
    }
  }

  private _onClick = (event: MouseEvent) => {
    const option = event
      .composedPath()
      .find(
        (node) =>
          node instanceof HTMLElement && node.localName === 'lu-select-option',
      ) as HTMLElement | undefined;
    if (!option || option.hasAttribute('disabled')) return;
    const contextOption = this._ctx?.options.find((item) => item === option);
    if (!contextOption) return;
    if (this._ctx?.multi) {
      this._ctx.commit(contextOption.value);
      (
        this._input() as
          | (HTMLElement & { syncUserSelection?: () => void })
          | null
      )?.syncUserSelection?.();
    } else {
      this._ctx.commit(contextOption.value);
      (
        this._input() as
          | (HTMLElement & { syncUserSelection?: () => void })
          | null
      )?.syncUserSelection?.();
      this._ctx?.setOpen(false);
    }
  };

  private _onKeydown = (event: KeyboardEvent) => {
    if (!this._ctx?.open) return;
    const options = this._ctx.options.filter((item) => !item.disabled);
    const current = options.findIndex(
      (item) => item.id === this._ctx?.activeId,
    );
    const activate = (index: number) => {
      const option = options[index];
      if (option) this._ctx?.setActive(option);
    };
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activate(Math.min(options.length - 1, current + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activate(Math.max(0, current < 0 ? options.length - 1 : current - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      activate(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      activate(options.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this._ctx.setOpen(false);
      this._input()?.focus();
    } else if (event.key === 'Tab' && this._ctx.multi) {
      this._input()?.focus({ preventScroll: true });
      this._ctx.setOpen(false);
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      event.key !== ' '
    ) {
      this._typeBuffer += event.key.toLocaleLowerCase();
      clearTimeout(this._typeTimer);
      this._typeTimer = setTimeout(() => (this._typeBuffer = ''), 700);
      const match = options.find((option) =>
        option
          .getDisplayValue()
          .toLocaleLowerCase()
          .startsWith(this._typeBuffer),
      );
      if (match) this._ctx.setActive(match);
    } else if (
      (event.key === ' ' || event.key === 'Enter') &&
      this._ctx.multi
    ) {
      event.preventDefault();
      const active = options.find((item) => item.id === this._ctx?.activeId);
      if (active) {
        this._ctx.commit(active.value);
        (
          this._input() as
            | (HTMLElement & { syncUserSelection?: () => void })
            | null
        )?.syncUserSelection?.();
      }
    }
  };

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeydown);
    document.removeEventListener('pointerdown', this._outside, true);
    document.removeEventListener('focusin', this._outside, true);
    window.removeEventListener('resize', this._schedulePosition);
    window.removeEventListener('scroll', this._schedulePosition, true);
    clearTimeout(this._typeTimer);
    cancelAnimationFrame(this._positionFrame);
    this._registered?.unregisterPopup(this);
    this._registered = undefined;
    super.disconnectedCallback();
  }

  render() {
    return html`<slot></slot>`;
  }
}
