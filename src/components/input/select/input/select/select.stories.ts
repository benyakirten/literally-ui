import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

import './select';
import '../combobox/combobox';
import '../../option/option';
import '../../popup/listbox';
import '../../context';

const meta: Meta = {
  title: 'Select',
  component: 'lu-select-input',
  parameters: { layout: 'centered' },
};

export const Default: StoryObj = {
  render: () => html`<form>
    <lu-select-context>
      <label for="story-country">Country</label>
      <lu-select-input
        id="story-country"
        name="country"
        required
      ></lu-select-input>
      <lu-select-listbox>
        <lu-select-option value="ca">Canada</lu-select-option>
        <lu-select-option value="us">United States</lu-select-option>
        <lu-select-option value="mx" disabled
          >Mexico (unavailable)</lu-select-option
        >
      </lu-select-listbox>
    </lu-select-context>
  </form>`,
};

export const Multiple: StoryObj = {
  render: () => html`<form>
    <lu-select-context>
      <label for="story-fruit">Fruits</label>
      <lu-select-input id="story-fruit" name="fruit" multi></lu-select-input>
      <lu-select-listbox>
        <lu-select-option value="apple">Apple</lu-select-option>
        <lu-select-option value="pear">Pear</lu-select-option>
        <lu-select-option value="plum">Plum</lu-select-option>
      </lu-select-listbox>
    </lu-select-context>
  </form>`,
};

export const SearchableSingle: StoryObj = {
  render: () => html`<form>
    <lu-select-context>
      <label for="searchable-city">City</label>
      <lu-select-combobox
        id="searchable-city"
        name="city"
        placeholder="Search cities…"
      ></lu-select-combobox>
      <lu-select-listbox>
        <lu-select-option value="nyc">New York City</lu-select-option>
        <lu-select-option value="york">York</lu-select-option>
        <lu-select-option value="london">London</lu-select-option>
        <lu-select-option value="new-delhi">New Delhi</lu-select-option>
      </lu-select-listbox>
    </lu-select-context>
  </form>`,
};

export const SearchableMultiple: StoryObj = {
  render: () => html`<form>
    <lu-select-context>
      <label for="searchable-fruit">Fruits</label>
      <lu-select-combobox
        id="searchable-fruit"
        name="fruit"
        placeholder="Search fruits…"
        multi
      ></lu-select-combobox>
      <lu-select-listbox>
        <lu-select-option value="apple">Apple</lu-select-option>
        <lu-select-option value="pear">Pear</lu-select-option>
        <lu-select-option value="plum">Plum</lu-select-option>
        <lu-select-option value="orange">Orange</lu-select-option>
      </lu-select-listbox>
    </lu-select-context>
  </form>`,
};

export const LongList: StoryObj = {
  render: () => html`<form>
    <lu-select-context>
      <label for="story-city">City</label>
      <lu-select-input id="story-city" name="city"></lu-select-input>
      <lu-select-listbox style="--lu-select-popup-max-height: 300px">
        ${Array.from(
          { length: 30 },
          (_, index) => html`
            <lu-select-option value="city-${index + 1}">
              City ${index + 1}
            </lu-select-option>
          `,
        )}
      </lu-select-listbox>
    </lu-select-context>
  </form>`,
};

export const Empty: StoryObj = {
  render: () => html`<form>
    <lu-select-context>
      <label for="story-empty">No available choices</label>
      <lu-select-input id="story-empty" name="empty"></lu-select-input>
      <lu-select-listbox></lu-select-listbox>
    </lu-select-context>
  </form>`,
};

export default meta;
