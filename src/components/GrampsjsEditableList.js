/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
import {css, html, LitElement} from 'lit'

import {fireEvent} from '../util.js'
import '@material/mwc-icon-button'
import '@material/mwc-list'
import '@material/mwc-list/mwc-list-item'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {
  inlineEditActive,
  renderOpenButton,
  renderUnlinkButton,
} from './GrampsjsInlineEdit.js'

export class GrampsjsEditableList extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-list,
        mwc-list > * {
          --mdc-ripple-color: transparent;
        }

        mwc-list > * {
          transition: background-color 0.1s, color 0.1s;
        }

        mwc-list[activatable] [selected] {
          background-color: var(
            --grampsjs-editable-list-selected-background-color
          );
        }

        mwc-list[activatable] [mwc-list-item]:not([selected]):hover,
        mwc-list[activatable] [mwc-list-item]:not([selected]):focus {
          background-color: var(
            --grampsjs-editable-list-hover-background-color
          );
        }

        mwc-list[activatable] [mwc-list-item]:not([selected]):active {
          background-color: var(
            --grampsjs-editable-list-active-background-color
          );
        }

        mwc-list[activatable] [mwc-list-item][selected]:hover,
        mwc-list[activatable] [mwc-list-item][selected]:focus {
          background-color: var(
            --grampsjs-editable-list-selected-hover-background-color
          );
          color: var(--grampsjs-body-font-color-90);
        }

        mwc-list[activatable] [mwc-list-item][selected]:active {
          background-color: var(
            --grampsjs-editable-list-selected-active-background-color
          );
        }

        mwc-icon-button {
          --mdc-theme-text-disabled-on-light: var(
            --grampsjs-body-font-color-25
          );
        }

        /* open / remove reference buttons in the meta slot of a row */
        mwc-list-item[hasMeta] {
          --mdc-list-item-meta-size: auto;
        }

        [slot='meta'] {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        [slot='meta'] mwc-icon-button {
          --mdc-icon-button-size: 36px;
          --mdc-icon-size: 20px;
          color: var(--mdc-theme-secondary);
        }

        mwc-icon.placeholder {
          width: 40px;
          height: 40px;
          line-height: 40px;
          border-radius: 50%;
        }
      `,
    ]
  }

  static get properties() {
    return {
      data: {type: Array},
      edit: {type: Boolean},
      objType: {type: String},
      dialogContent: {type: String},
      dialogTitle: {type: String},
      hasAdd: {type: Boolean},
      hasShare: {type: Boolean},
      hasEdit: {type: Boolean},
      hasReorder: {type: Boolean},
      // allow adding/removing references in view mode (with edit permission)
      inlineEdit: {type: Boolean},
      _selectedIndex: {type: Number},
    }
  }

  constructor() {
    super()
    this.data = []
    this.edit = false
    this.objType = ''
    this.dialogContent = ''
    this.dialogTitle = ''
    this.hasAdd = true
    this.hasShare = false
    this.hasEdit = false
    this.hasReorder = false
    this.inlineEdit = false
    this._selectedIndex = -1
  }

  get _inlineActive() {
    return inlineEditActive(this)
  }

  // whether rows show the open/unlink buttons (see _renderRowActions)
  get _hasRowActions() {
    return this.edit || this._inlineActive
  }

  // meta buttons of a row: "open" in edit mode, "remove reference" in
  // inline (view) mode
  _renderRowActions(path, index) {
    if (this.edit && path) {
      return renderOpenButton(this, path)
    }
    if (this._inlineActive) {
      return renderUnlinkButton(this, () => {
        this._selectedIndex = index
        this._handleDelete(new Event('unlink'))
        this._selectedIndex = -1
      })
    }
    return ''
  }

  render() {
    return html`
      ${Object.keys(this.data).length === 0 && !this.edit && !this._inlineActive
        ? ''
        : html`
            ${this.edit ? this._renderActionBtns() : ''}
            ${this._inlineActive ? this._renderInlineBtns() : ''}
            <mwc-list
              ?activatable="${this.edit}"
              @action="${this._handleSelected}"
            >
              ${this.sortData([...this.data]).map((obj, i, arr) =>
                this.row(obj, i, arr)
              )}
            </mwc-list>
          `}
      ${this.dialogContent}
    `
  }

  _handleSelected(e) {
    this._selectedIndex = e.detail.index
  }

  // function to sort the data, if necessary
  sortData(dataCopy) {
    return dataCopy
  }

  row(obj, i, arr) {
    return ''
  }

  // add/share buttons in view mode
  _renderInlineBtns() {
    return html`
      ${this.hasShare
        ? html`
            <mwc-icon-button
              class="edit"
              icon="add_link"
              @click="${this._handleShare}"
            ></mwc-icon-button>
          `
        : ''}
      ${this.hasAdd
        ? html`
            <mwc-icon-button
              class="edit"
              icon="add"
              @click="${this._handleAdd}"
            ></mwc-icon-button>
          `
        : ''}
    `
  }

  _renderActionBtns() {
    return html`
      ${this.hasShare
        ? html`
            <mwc-icon-button
              class="edit"
              icon="add_link"
              @click="${this._handleShare}"
            ></mwc-icon-button>
          `
        : ''}
      ${this.hasAdd
        ? html`
            <mwc-icon-button
              class="edit"
              icon="add"
              @click="${this._handleAdd}"
            ></mwc-icon-button>
          `
        : ''}
      ${this.hasEdit
        ? html`
            <mwc-icon-button
              ?disabled="${this._selectedIndex === -1}"
              class="edit"
              icon="edit"
              @click="${this._handleEdit}"
            ></mwc-icon-button>
          `
        : ''}
      ${this.hasReorder
        ? html`
            <mwc-icon-button
              ?disabled="${this._selectedIndex === -1 ||
              this._selectedIndex === 0}"
              class="edit"
              icon="arrow_upward"
              @click="${this._handleUp}"
            ></mwc-icon-button>
            <mwc-icon-button
              ?disabled="${this._selectedIndex === -1 ||
              this._selectedIndex === this.data.length - 1}"
              class="edit"
              icon="arrow_downward"
              @click="${this._handleDown}"
            ></mwc-icon-button>
          `
        : ''}
      <mwc-icon-button
        ?disabled="${this._selectedIndex === -1}"
        class="edit"
        icon="delete"
        @click="${this._handleDelete}"
      ></mwc-icon-button>
    `
  }

  updated(changed) {
    if (changed.has('edit')) {
      this._selectedIndex = -1
      this.dialogContent = ''
      this._reselectIndex = undefined
    }
    if (changed.has('data') && this._reselectIndex !== undefined) {
      // keep the moved row selected once the reordered data has arrived
      const index = this._reselectIndex
      this._reselectIndex = undefined
      if (index >= 0 && index < this.data.length) {
        this._selectedIndex = index
        this.renderRoot.querySelector('mwc-list')?.select(index)
      }
    }
  }

  // call when an up/down move has been requested for the selected row
  _selectAfterMove(delta) {
    this._reselectIndex = this._selectedIndex + delta
  }

  _handleActionClick(e, action, handle) {
    fireEvent(this, 'edit:action', {action, handle})
    e.preventDefault()
    e.stopPropagation()
  }
}
