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

Single-select uses a select-only combobox: focus stays on the input while navigating, and selection is committed with Enter/Space. Multiple-select (`multi`) uses a button that opens a focused multiselect listbox; Space toggles options immediately. `.values` is the canonical array API; `.value` reads/writes its first entry. Empty-string option values are valid, and `.values = []` clears selection unambiguously. Values not yet represented by an option are retained but do not submit or satisfy `required` until resolved.

Options require explicit unique `value` attributes. `display-value` overrides normalized option text. Options may contain decorative, noninteractive markup. Use a real associated label or `aria-label`/`aria-labelledby`. User selection dispatches bubbling, composed `input` then `change`; programmatic updates do not.

Customize popup height with `--lu-select-popup-max-height` (300px default) and option spacing with `--lu-select-option-padding`. The input exposes `value` and `indicator` parts. Search, tree/grid/dialog popups, portals, and nested providers are not supported.
