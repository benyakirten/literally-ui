import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

import './select';
import '../../option/option';
import '../../popup/listbox';
import '../../context';

const Meta: Meta = {};

export const Default: StoryObj = {
  render: () => {
    return html`<lu-select-context>
      <lu-select>
        <lu-listbox>
          <lu-select-option value="option-1">Option 1</lu-select-option>
          <lu-select-option>Option 2</lu-select-option>
        </lu-listbox>
      </lu-select>
    </lu-select-context>`;
  },
};
