# Composable Lit select: implementation plan

## 1. Purpose and agreed scope

Build a client-rendered, form-associated select from four independently styled Lit components:

```html
<lu-select-context>
  <label for="country">Country</label>
  <lu-select-input id="country" name="country" required></lu-select-input>
  <lu-select-listbox>
    <lu-select-option value="ca">Canada</lu-select-option>
    <lu-select-option value="us">United States</lu-select-option>
  </lu-select-listbox>
</lu-select-context>
```

Support both single and multiple selection in this implementation. Multiple selection uses the same composition with `multi` on the input. Searchable inputs, grid/tree/dialog popups, groups, hierarchical options, virtualization, portals, SSR/hydration, and nested providers are out of scope. Do not implement speculative behavior for those features.

The input is the **only form-associated element (FACE)**. It owns the public selection, configuration, validation, and form APIs. The provider coordinates internal state; the popup and options are not form controls. Document this ownership in exported class/interface docstrings and usage documentation.

Rename the existing `lu-select` and `lu-listbox` elements to `lu-select-input` and `lu-select-listbox`. Update repository call sites and stories; compatibility aliases are not required. Retain the existing directories unless a change is necessary.

Keep every component's CSS in an adjacent `*.styles.ts` module. Use existing Lit and `@lit/context` dependencies; a positioning dependency is unnecessary for the initial implementation.

## 2. Accessibility architecture: keep semantic hosts in the same tree

### Why the current structure cannot simply use IDs

An ordinary `aria-activedescendant="option-id"` reference on a node inside the input's shadow root cannot reliably identify an option in another shadow root or in the document tree. Likewise, `aria-controls` cannot be treated as an arbitrary cross-shadow-root selector. IDs alone do not solve this.

Element-reference reflection APIs such as `ariaActiveDescendantElement` have scoping rules and browser/assistive-technology interoperability constraints; they are not a universal cross-shadow escape hatch. Do not make the baseline depend on them, proxy duplicate options into the input, or add `aria-owns` as an attempted workaround.

### Required solution

Put semantics and focus on **custom-element hosts**, not on internal shadow DOM wrappers:

- Single-select: `lu-select-input` host is the focusable `role="combobox"`.
- Popup: `lu-select-listbox` host is `role="listbox"` and the popover element.
- Options: `lu-select-option` hosts are `role="option"` and carry IDs and `aria-selected`.
- Shadow roots contain presentational markup/slots only. They must not duplicate these roles or create a second tab stop.
- Provider shadow root renders a default slot. Never omit the slot; otherwise its children will not render.
- Ordinary light-DOM wrappers between consumers and the provider are supported.
- Input, popup, and options must share the same `getRootNode()` tree. This also works when the entire composition lives within a single enclosing component's shadow root.
- Putting individual consumers inside different wrapper shadow roots is unsupported. Detect and report this configuration clearly.
- A top-layer popover changes painting, not DOM parentage or tree scope, so it does not break these ID relationships or context ancestry.

Use host ARIA attributes for dynamic state and set component-owned roles consistently. Preserve consumer-supplied IDs; otherwise generate stable IDs once per instance. Never copy the input host ID onto an internal node.

### Single-select semantics

The input host has:

- `role="combobox"`, `tabindex="0"` when enabled.
- `aria-haspopup="listbox"`.
- `aria-expanded="true|false"`.
- `aria-controls` referencing the registered popup host.
- `aria-activedescendant` only while open and an enabled option is active.
- `aria-required`, `aria-invalid`, and `aria-disabled` synchronized with effective state.

DOM focus stays on the input while navigating. The active option must be a descendant of the controlled listbox. Options never enter the tab sequence.

### Multiple-select semantics: a button opening a multiselect listbox

Do **not** represent multiple selection as if it were the APG single-value select-only combobox. Use an explicitly different, documented interaction pattern:

- In `multi` mode, the input host is `role="button"`, with `aria-haspopup="listbox"`, `aria-expanded`, and `aria-controls`.
- Opening moves DOM focus to the popup host, which has `tabindex="-1"`, `role="listbox"`, and `aria-multiselectable="true"`.
- The listbox host owns `aria-activedescendant` while active. Individual options remain unfocusable.
- Arrow navigation changes the active option without changing selection. Space toggles selection without requiring Control/Command.
- Multiple selections commit immediately; Escape dismisses rather than rolling back previously toggled selections.
- Put required/invalid semantics on the listbox in this mode, not unsupported `aria-required` on the button. The FACE input still owns validity and exposes `aria-invalid` where applicable.

This pattern avoids inventing a multivalue combobox accessibility contract. The same input class changes its semantic role with `multi`; document this clearly. A future searchable multivalue component will need its own interaction design.

### Naming and descriptions

Support a real `<label for="input-id">` using FACE label association, plus explicit `aria-label` and `aria-labelledby` on the input. Test actual accessible names on host-role controls; do not assume that DOM label association alone proves the accessibility mapping. If label-click focus does not work consistently for the FACE host, add a narrowly scoped association handler using `internals.labels`, with cleanup, without double activation.

Give the popup its own accessible name: explicit popup naming wins; otherwise derive it from the input's label sources. Do not use the changing selected-value text as the field's label. Preserve author-provided `aria-describedby`; do not overwrite it with selection summaries. Reference external labeling nodes only within the supported tree scope.

## 3. Public API

### `lu-select-context`

- Internal coordinator, extending `LUElement`.
- `validation: 'lax' | 'log' | 'error'`, default `'log'`, retained from the prototype.
- Exactly one registered input and one registered listbox. Any number of options inside that listbox.
- No public form value or independent `open` property competing with input state.
- Nested providers are unsupported; detect and diagnose them rather than implementing nesting logic.

### `lu-select-input`

Properties:

| Property              | Contract                                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name: string`        | Submission name; reflected string attribute.                                                                                                                                            |
| `value: string`       | First selected/requested value, or `''` when none. Setting it replaces selection with exactly that string, including `''`.                                                              |
| `values: string[]`    | Canonical public selection array; property-only, defensive copies; setter deduplicates in insertion order. In single mode permit at most one entry. Assign `[]` to clear unambiguously. |
| `multi: boolean`      | Default false; reflected. Switching to single retains the first value and emits no user event.                                                                                          |
| `disabled: boolean`   | Author-disabled state, reflected. Also respect fieldset disabling through FACE callbacks without clobbering the author setting.                                                         |
| `required: boolean`   | Reflected; requires at least one resolved selection, including a real option with empty-string value.                                                                                   |
| `placeholder: string` | Displayed when nothing is resolved, default `Select…`.                                                                                                                                  |
| `open: boolean`       | Public request/property synchronized with actual popup state; ignored/coerced closed if disabled or popup is unavailable.                                                               |

Methods: `focus(options?)`, `show()`, `hide()`, `checkValidity()`, `reportValidity()`, and `setCustomValidity(message)`. Standard FACE getters include `form`, `labels`, `validity`, `validationMessage`, and `willValidate`.

`value === ''` is intentionally ambiguous as a getter, like many string-value controls; `.values` distinguishes no selection (`[]`) from selecting the empty-string option (`['']`). Absence of the `value` attribute means no initial selection. An explicit `value=""` requests the empty-string option. Do not reflect the getter's empty fallback in a way that creates a new selection.

`values` is authoritative; `value` is a convenience alias, not a second state store. For initial configuration, an explicitly assigned `.values` takes precedence over an attribute-based `value`. Use the existing `value` attribute as the declarative initial/default value; avoid continuously reflecting selection back into that attribute. Document this deliberate departure from the prototype.

Keep requested values that do not yet match an option. They remain in the public API but have no selected option, contribute no form entry, and do not satisfy `required` until resolved. This supports asynchronous options. Remove neither unknown values nor values whose options temporarily disappear.

Do not implement readonly interaction in this version. If the inherited mixin exposes `readonly`, document it as unsupported for this component rather than accidentally providing half-working behavior.

### `lu-select-option`

- `value: string`: required explicit attribute or explicit property assignment; unique within the provider; empty string is valid.
- `displayValue: string`, attribute `display-value`: nonempty override for display and typeahead text.
- Default display text: trimmed, whitespace-normalized assigned text, including text descendants of decorative markup. Do not read `slot.textContent` to obtain distributed content.
- `disabled: boolean`, reflected, with `aria-disabled`.
- Host `aria-selected="true|false"`; host never has a positive or zero tabindex.
- Read-only selected/active state surfaced as `data-selected` and `data-active` for styling.
- Default slot allows text and noninteractive decoration. Links, inputs, buttons, and nested interactive widgets are unsupported.
- Observe relevant slotted subtree text mutations, property changes, and slot changes; unregister observers on disconnect.

Duplicate values, missing explicit values, missing provider, mismatched tree scopes, and invalid compositions are configuration errors. Under `log`, warn once per distinct issue, not on every render; under `error`, throw a descriptive error; under `lax`, omit diagnostic logging. In all modes preserve safety invariants: deterministic first option in DOM order wins for duplicate values; do not create ambiguous selections or cross-tree ARIA references. Invalid extra inputs/popups do not replace an already registered owner.

## 4. Context and state model

Refactor `context.ts` into typed interfaces and a provider/controller with immutable published snapshots. Keep the implementation small; extract a pure helper module only where it makes state transitions or tests materially clearer.

Suggested conceptual contract (names may be adapted consistently):

```ts
interface SelectOptionRecord {
  element: HTMLElement;
  id: string;
  value: string;
  text: string;
  disabled: boolean;
}

interface SelectSnapshot {
  options: readonly SelectOptionRecord[];
  requestedValues: readonly string[];
  resolvedValues: readonly string[];
  activeId: string | null;
  open: boolean;
  multi: boolean;
  disabled: boolean;
  popupId: string | null;
}
```

Context adds stable callbacks for registering/unregistering/updating consumers, applying programmatic selection, opening/closing with a reason, moving the active option, selecting/toggling, and typeahead. Keep DOM-reference interfaces narrow; do not use the full `FaceMixinInterface` as a registration protocol merely to read `multi`.

Invariants:

1. The provider owns canonical shared state; consumers receive new context object identities for actual changes. Mutating a `Set` or array in place is insufficient for `@lit/context` notification.
2. Registration is keyed by element identity. Unregistration is idempotent. Reconnection does not duplicate options or reset defaults.
3. Options are ordered by DOM order, not connection order. Reconcile on popup subtree changes and registration changes using a batched microtask; observe child-list mutations for moves that do not cause reconnects.
4. Active identity is an option ID, not a value; `null` means inactive. Empty string values remain usable.
5. Only enabled options can become active or be toggled by users. Programmatically selected disabled options remain representable and submitted, matching the documented custom control policy.
6. Selection and active state are distinct. Single navigation does not commit. Multi navigation never toggles implicitly.
7. Programmatic updates do not emit `input` or `change`. Registration, text changes, reorder, reset, restoration, and mode changes also emit no user-selection events.
8. Unmatched requested values persist. Removing an active option repairs active state to the nearest enabled option in DOM order, or `null` if none remain.
9. All subscriptions, mutation observers, document listeners, and positioning callbacks clean up on disconnect. Call superclass lifecycle methods.

Use a context-consumer callback/controller or another explicitly reliable lifecycle hook to register once the context is available. Do not access an assumed initialized `_ctx!` before `super.connectedCallback()`, and do not assume option slots have rendered during connection. A disconnected consumer unregisters from the provider it actually registered with.

Reject or warn on changing `multi` while open only if necessary; preferably close first, update semantic mode and normalize values, then permit reopening.

## 5. Interaction state machine

Use explicit reasons such as `keyboard`, `pointer`, `escape`, `tab`, `outside`, `programmatic`, `disabled`, and `disconnect` for opening/closing. One transition path updates context, popover visibility, active state, and focus. Prevent feedback loops from popover `toggle` events.

### Single select

Follow the APG select-only combobox example, with the following concrete contract:

| Input               | Closed                                                  | Open                                                   |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Enter / Space       | Open; active resolved selection or first enabled option | Commit active option and close                         |
| ArrowDown           | Open; active selected or first enabled option           | Move next enabled option                               |
| ArrowUp             | Open; active selected or first enabled option           | Move previous enabled option                           |
| Home / End          | Open and activate first / last enabled option           | Activate first / last enabled option                   |
| Escape              | No action                                               | Close without committing active option                 |
| Tab / Shift+Tab     | Native traversal                                        | Commit active option, close, preserve native traversal |
| Printable character | Open and run typeahead                                  | Run typeahead without committing                       |
| Alt+ArrowDown       | Open                                                    | Leave open                                             |
| Alt+ArrowUp         | No action                                               | Commit active and close                                |

Navigation stops at boundaries; no arrow wrapping. Typeahead may wrap while searching. On opening, `activeId` defaults to the first enabled resolved selection, otherwise the first enabled option. Escape leaves the committed value unchanged. Outside click or focus leaving by another route dismisses without committing the active preview. Reopen restores the committed option rather than a discarded preview.

Pointer hover can activate an enabled option but cannot select it. Prevent pointer-induced focus movement away from the single-select input when appropriate; selection happens on click, not pointerdown, to avoid interfering with scrolling. Clicking an enabled option commits and closes. Restore input focus only if dismissal has not transferred focus intentionally to another control.

### Multiple select

| Input               | Trigger closed                      | Listbox focused/open                                                                                                                       |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Enter / Space       | Open and focus listbox              | Space toggles active; Enter closes and returns focus to trigger                                                                            |
| ArrowDown / ArrowUp | Open and focus listbox              | Move active without selecting                                                                                                              |
| Home / End          | Open at first / last enabled option | Move to first / last enabled option                                                                                                        |
| Escape              | No action                           | Close and return focus to trigger; keep toggles                                                                                            |
| Tab / Shift+Tab     | Native traversal                    | Close and traverse relative to the trigger                                                                                                 |
| Printable character | Open and run typeahead              | Move active using typeahead                                                                                                                |
| Ctrl+A / Cmd+A      | No interception                     | Select all enabled options; if all enabled options are selected, deselect those enabled options; preserve selected disabled/unknown values |

No range selection, Shift+Arrow selection, or chip-removal UI in this version. Pointer click toggles an enabled option and keeps the popup open. Active and selected state are visually distinct.

Because focus is moved into a sibling popup, native Tab from the popup may skip content between it and the trigger. On Tab, synchronously focus the trigger without scrolling and close before allowing the native Tab default; verify this in browser tests. Never implement a blanket tab trap. On outside pointer/focus dismissal, do not steal focus back from the destination.

### Typeahead and edge cases

- Use `event.key` values `ArrowDown` and `ArrowUp`, not `DownArrow`/`UpArrow`.
- Use a roughly 700 ms reset interval, case-insensitive prefix matching, and cycle on repeated single characters.
- Ignore composing events and unrelated modifier shortcuts. Space is a command except when extending an existing typeahead sequence, following the select-only convention.
- Skip disabled options. Prevent default only for handled commands; printable typeahead must not trigger browser page search/scroll where preventable.
- Empty/all-disabled popups may open but have no active descendant; navigation and commit are safe no-ops. Provide a visual empty-state message that is not an option.
- Closing/disabling clears typeahead and active-descendant attributes. Disabled controls cannot open or change through user input.

## 6. Form behavior and events

Implement FACE behavior in the input. Audit `src/components/input/face-mixin.ts` before choosing whether to extend it with narrowly scoped hooks or implement select-specific overrides. Do not break unrelated controls or call `attachInternals()` twice.

Required corrections/constraints:

- Existing mixin writes `value || null`, which loses a valid empty-string value.
- Existing mixin automatically writes the public value in `updated()`. A select needs custom serialization, particularly for multi; ensure this path cannot overwrite the select's `FormData` serialization later in the same update.
- Existing reset baseline is captured on every connection. Defaults must survive disconnect/reconnect.
- Existing disabled callback overwrites author-disabled state. Track fieldset-disabled state separately and compute effective disabled state.
- Keep baseline changes limited to needs of this component and add regression coverage if shared behavior changes. If safe extension hooks are cleaner, introduce them rather than copying the whole mixin.

Submission:

- Single mode: submit the resolved selected string, including `''`, or `null` when none is resolved.
- Multi mode: create `FormData` and append one entry per resolved selected value under the current input `name`, in `.values` order. Never serialize with commas. Missing/empty name contributes no entries.
- Disabled controls contribute no entries, respecting native FACE exclusion as well as consistent internal state.
- Recompute form data on name, effective disabled, mode, selection, and option-resolution changes.
- Pass a versioned JSON string as the separate state argument to `setFormValue()`, containing requested values and sufficient mode information for restoration. Submission data and restoration state are different representations.

Defaults and reset:

- Capture initial requested selection once after initial declarative/pre-upgrade property configuration is available, independent of option availability. Use this as the reset baseline; do not recapture on reconnection.
- `formResetCallback()` restores the initial requested values, closes the popup, repairs display/validity/form state, and emits no selection events.
- `formStateRestoreCallback()` validates and restores the versioned state payload, normalizing to the current mode. Ignore malformed payloads safely and diagnose them where useful.
- Autofill/restore must not treat serialized JSON as an option value.

Validation:

- `required` is invalid when there are zero resolved selections. A real empty-string option counts as a selection.
- Unknown values do not satisfy `required` until resolved.
- `setCustomValidity()` combines custom-error and required checks; always provide a nonempty message for invalid flags.
- Update `aria-invalid` consistently and clear it when valid. Disabled controls are barred from validation through FACE behavior.
- Anchor validation to the host/focusable surface, not an inaccessible shadow node. Check that `reportValidity()` focuses a useful control in both modes.

Events:

- User commits in single mode and each user toggle/bulk action in multi mode emit one bubbling, composed `input`, then one bubbling, composed `change`, from the input host, only when requested selection actually changes.
- Use native-shaped `Event` instances; do not require `CustomEvent.detail` to read selection. Listeners read `.value`/`.values` from the input.
- Ensure public selection, context, and form data are updated before dispatch, so listeners observe consistent state.
- Closing after already committed multi selections emits no additional change. Navigation, hover, and programmatic updates emit none.

## 7. Popover, positioning, and styling

Set `popover="manual"` on the listbox host and use `showPopover()`/`hidePopover()`. Manual popovers do not supply dismissal or positioning automatically; implement both explicitly. Use `:popover-open`/guarded calls and reconcile unexpected `toggle` closures back into context. Calls on detached elements must not throw uncaught exceptions.

Position using viewport-relative trigger geometry and a fixed-position popup. While open:

1. Measure the input's `getBoundingClientRect()` and available viewport space.
2. Prefer below, flip above when appropriate, clamp horizontal placement, and keep a small viewport gutter.
3. Match trigger width by default while clamping to available viewport width.
4. Constrain height to the configured maximum and available space.
5. Update on relevant scroll, resize, and trigger size changes, batching in `requestAnimationFrame`; remove listeners/observers when closed.
6. Scroll the active option into view within the listbox without scrolling the whole page. Prefer local scroll calculations if `scrollIntoView()` moves ancestors unexpectedly.

Do not depend on CSS anchor positioning for baseline browser support. Feature detection should give a clear unsupported-browser diagnostic if Popover API is unavailable; do not build a separate legacy popup system in this scope.

Install outside-pointer and focus-dismissal listeners only while open. Use `event.composedPath()` for containment. Treat trigger and popup as one logical control. Do not close between pointerdown and a legitimate option click.

CSS modules:

- `context.styles.ts`: host layout only; default block layout rather than `display: contents` assumptions.
- `input/select/select.styles.ts`: host focus ring, disabled styling, presentational value/placeholder/chevron elements.
- `popup/listbox.styles.ts`: top-layer reset, border/background/shadow, scrolling, empty-state styling.
- `option/option.styles.ts`: enabled hover, active, selected, disabled, and forced-colors states.

Suggested tokens:

- `--lu-select-popup-max-height: 300px`.
- `--lu-select-popup-gap`.
- `--lu-select-option-padding`.
- Small consistent color/border/focus tokens, preferably existing library tokens where present.

Use component-owned custom properties for calculated available space and coordinates; do not overwrite author CSS variables or whole inline style strings. CSS can use `min(var(--lu-select-popup-max-height, 300px), var(--internal-available-height))`. Support styling host classes and exposing internal input parts such as `value`, `placeholder`, and `indicator`. Host-role options/listbox are styled directly, not through fictitious host `::part` selectors.

Default multi display is selected labels joined by `, `, excluding unresolved values; overflow visually truncates without dropping the full accessible text. Empty resolved selection displays the placeholder. Keep clear focus indication and distinct active-versus-selected styling, including forced-colors mode. No animation is necessary.

## 8. File-level implementation sequence

### Step 1 — Contracts and pure state helpers

- Refactor `src/components/input/select/context.ts` with registration records, immutable snapshots, stable commands, invariant checks, and a rendering slot.
- Add `context.styles.ts`.
- Add pure helper tests for normalization, single/multi transitions, duplicate handling, typeahead, enabled-option navigation, and requested/resolved reconciliation.
- Avoid a generic framework for future popup types; use the listbox role now.

### Step 2 — Options and registration lifecycle

- Update `option/option.ts` with host roles/IDs, explicit values, disabled state, derived display text, registration/update/unregistration, and selected/active attributes.
- Add `option/option.styles.ts`.
- Ensure option reordering and dynamic slot text changes reconcile correctly.

### Step 3 — Input and FACE

- Update `input/select/select.ts` to register `lu-select-input`, extending the appropriate FACE base.
- Implement public selection/configuration APIs, host focus/semantics, display, keyboard handling, labels, serialization, reset, restore, and validity.
- Populate `input/select/select.styles.ts`.
- Apply only necessary changes to `src/components/input/face-mixin.ts`, with regression tests if shared behavior is modified.
- Leave `input/combobox/combobox.ts` unimplemented; searchable input is not part of this task.

### Step 4 — Listbox and popover integration

- Update `popup/listbox.ts` to register `lu-select-listbox`, with host role/popover, slot, ordered registry reconciliation, multi focus/keyboard handling, dismissal, and positioning.
- Add `popup/listbox.styles.ts`.
- Avoid the prototype's incorrect `update()` override calling `super.updated()`; use normal Lit lifecycle methods and call their matching superclass implementation.

### Step 5 — Exports, documentation, and stories

- Populate `src/components/input/select/index.ts` with public exports and required registration imports consistent with repository conventions.
- Update `input/select/select.stories.ts` and search the repository for old tag names.
- Add `src/components/input/select/README.md` documenting composition constraints, FACE ownership, labels, single/multi semantic differences, `.value`/`.values`, empty values, unknown values, defaults, events, CSS tokens, and unsupported features.
- Add class/property JSDoc with the same core ownership and accessibility constraints.
- Stories: single selection, required form, multiple selection/repeated form entries, disabled options/control, empty list, long scrollable list, async/dynamic options, decorative option content, and CSS max-height override.

### Step 6 — Browser tests and validation

Current `vitest.config.ts` is a non-browser unit-test setup. Use it for pure helpers; do not pretend it validates FACE or accessibility trees.

Existing Playwright config already declares Chromium, Firefox, and WebKit projects but has no configured test server. Inspect `integration/example.spec.ts`, `.storybook`, and existing entry points before wiring a minimal deterministic browser fixture. Use a dedicated fixture HTML page served by Vite (or an existing suitable fixture convention) and configure Playwright `webServer`/`baseURL` so tests run without manually starting a server. Do not run a perpetual server via an agent terminal command; let the test runner own its lifecycle.

Add focused `integration/select.spec.ts` tests and fixtures. Avoid unrelated rewrites of existing test configuration or broken sample tests.

## 9. Acceptance tests

### Semantics and composition

- Hosts carry the expected roles in single and multi modes; only intended nodes are tabbable.
- Input has a stable accessible field name via a visible label and via explicit ARIA naming.
- `aria-controls` resolves to the popup in the same root; active-descendant IDs resolve to enabled options in that popup.
- No active descendant remains when closed or when no enabled option exists.
- Wrapper elements and an entire composition inside one enclosing shadow root work.
- Cross-tree composition, missing providers, extra owners, nested providers, duplicate values, and missing explicit values produce the defined diagnostics without invalid ARIA wiring.
- No duplicate IDs or duplicate semantic controls appear in shadow roots.

### Interaction

- Test each table's opening/navigation/commit/cancel behavior, including real `KeyboardEvent.key` names.
- Single highlighting does not change the value; Escape discards preview; Tab commits and moves focus naturally.
- Multi navigation does not select; Space toggles; Enter/Escape close with expected focus; Tab/Shift+Tab traverse relative to trigger without trapping.
- Multi Ctrl/Cmd+A acts only while the listbox is focused and emits one event pair per effective bulk change.
- Typeahead supports repeated letters, multiple characters, timeout, disabled skipping, and no-match cases.
- Pointer option selection/toggling, hover, scrollbar use, outside click, and focus-out dismissal behave correctly without stolen focus.
- Empty/all-disabled lists are safe; disabled control cannot open; no unnecessary event default cancellation.

### State and lifecycle

- Programmatic `.value`/`.values` updates synchronize all consumers without user events.
- Single/multi switches close and normalize predictably.
- Empty-string selection differs from no selection.
- Unknown values resolve when options arrive and persist when those options disappear.
- Option rename, disable, reorder, remove, reconnect, and text update repair active/display state.
- Reconnection does not duplicate registrations, event listeners, or reset baselines.

### Forms

- `new FormData(form)` contains the correct single value or repeated multi values, with no comma serialization.
- Empty-string option submits an empty string; unresolved/no selection contributes no entry.
- Name changes update multi entry keys; unnamed/disabled controls do not submit.
- Fieldset disabling and author-disabled state interact correctly.
- Required/custom validity, validity getters, `checkValidity()`, and `reportValidity()` work.
- Reset and state restoration update selection, display, form data, and validity without events.
- State restoration tolerates malformed input; changing selection can never be overwritten by the base mixin's scalar serialization.

### Presentation and browser behavior

- Popup is actually in the top layer, matches width, flips/clamps within viewport, and scrolls with a 300px default maximum.
- Consumer CSS can override the maximum height without changing TypeScript.
- Active-option scrolling does not unexpectedly scroll the page.
- Position updates after viewport/trigger changes; open/disconnect leaves no listeners behind.
- Focus and selection remain understandable in forced colors.

Run pure unit tests with `pnpm test:ci`, relevant Playwright tests with `pnpm exec playwright test integration/select.spec.ts`, lint with `pnpm lint`, formatting checks with `pnpm fmt:check`, and Storybook build with `pnpm build-storybook` where practical. Inspect the TypeScript configuration before choosing a typecheck command; do not claim a nonexistent package script was run. Report pre-existing unrelated failures separately.

Automated tests cannot establish full screen-reader conformance. Do a lightweight keyboard/accessibility-tree smoke check and document remaining manual NVDA/Firefox and VoiceOver/Safari checks as follow-up; do not spend this implementation on an extensive assistive-technology certification effort or claim those combinations were tested if they were not.

## 10. Completion criteria

The implementation is complete when both documented modes work end-to-end in the supported browser projects, form submission/reset/validation are correct, context lifecycle and dynamic options are covered, ARIA references stay within the supported tree scope, styling remains component-local and customizable, and examples/documentation match the renamed public API. Keep future searchable/hierarchical features out of the shipped behavior rather than leaving misleading partial support.
