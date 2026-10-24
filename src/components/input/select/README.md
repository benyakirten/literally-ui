# Select

```html
<lu-select-context>
  <label for="region">Region</label>
  <lu-select-input id="region" name="region" required></lu-select-input>
  <lu-select-listbox>
    <lu-select-option value="na">North America</lu-select-option>
    <lu-select-option value="eu">Europe</lu-select-option>
  </lu-select-listbox>
</lu-select-context>
```

The input is the only form-associated component. Keep input, listbox, and options in the same DOM tree under one context. Ordinary light-DOM wrappers are allowed; consumer components split across shadow roots and nested providers are not. The listbox uses the Popover API.

`lu-select-input` is a select-only control: focus stays on the trigger while navigating, and selection is committed with Enter/Space. In multiple mode it opens a focused multiselect listbox; Enter/Space toggle the active option without closing the listbox, Escape closes and returns focus, and Tab closes and continues focus traversal.

`lu-select-combobox` is the searchable variant. It creates its native text input internally; consumers configure it with attributes and do not provide a custom input. The native input remains in the same DOM tree as the listbox so its `aria-activedescendant` can reference the options. Typing filters options by case-insensitive substring without changing selection. Arrow keys move the active option, Enter or clicking commits a single value and closes, and Escape restores the committed display value. In multi mode, Enter or clicking toggles a selected value, displays a chip, clears the query, and leaves the listbox open. Backspace with an empty query removes the last chip.

`.values` is the canonical array API; `.value` reads/writes its first entry. Empty-string option values are valid, and `.values = []` clears selection unambiguously. Values not yet represented by an option are retained but do not submit or satisfy `required` until resolved.

Options require explicit unique `value` attributes. `display-value` overrides normalized option text. Options may contain decorative, noninteractive markup. Use a real associated label or `aria-label`/`aria-labelledby`. User selection dispatches bubbling, composed `input` then `change`; programmatic updates do not.

Customize popup height with `--lu-select-popup-max-height` (300px default) and option spacing with `--lu-select-option-padding`. The select-only input exposes `value` and `indicator` parts. Searchable input chips expose `chip` and `chip-remove` parts. Tree/grid/dialog popups, portals, and nested providers are not supported.
