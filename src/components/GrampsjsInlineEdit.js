/*
Helpers shared by the reference lists (events, citations, children, notes...)
so that referenced objects can be opened from edit mode, and references can
be added and removed without switching to edit mode.
*/

import {html} from 'lit'
import '@material/mwc-icon-button'
import '@material/web/dialog/dialog.js'
import '@material/web/button/text-button.js'

import {fireEvent} from '../util.js'

// list element with `inlineEdit` set, in view mode, and the user may edit
export function inlineEditActive(element) {
  return Boolean(
    !element.edit &&
      element.inlineEdit &&
      element.appState?.permissions?.canEdit
  )
}

// open a referenced object; from edit mode it opens in edit mode and the
// current object is in edit mode again when navigating back
export function openObject(element, path) {
  fireEvent(element, 'nav', {path, keepEdit: Boolean(element.edit)})
}

export function renderOpenButton(element, path, slot = '') {
  return html`
    <mwc-icon-button
      slot="${slot}"
      icon="open_in_new"
      title="${element._('Open object')}"
      @click="${e => {
        e.preventDefault()
        e.stopPropagation()
        openObject(element, path)
      }}"
    ></mwc-icon-button>
  `
}

// ask before removing a reference (sets element.dialogContent)
export function confirmUnlink(element, onConfirm) {
  const close = () => {
    // eslint-disable-next-line no-param-reassign
    element.dialogContent = ''
  }
  // eslint-disable-next-line no-param-reassign
  element.dialogContent = html`
    <md-dialog open @cancel="${e => e.preventDefault()}" @closed="${close}">
      <span slot="headline">${element._('Remove reference?')}</span>
      <div slot="content">
        ${element._('Only the reference is removed, not the object itself.')}
      </div>
      <div slot="actions">
        <md-text-button @click="${close}"
          >${element._('Cancel')}</md-text-button
        >
        <md-text-button
          @click="${() => {
            close()
            onConfirm()
          }}"
        >
          ${element._('Yes')}
        </md-text-button>
      </div>
    </md-dialog>
  `
}

export function renderUnlinkButton(element, onConfirm, slot = '') {
  return html`
    <mwc-icon-button
      slot="${slot}"
      icon="link_off"
      title="${element._('Remove reference')}"
      @click="${e => {
        e.preventDefault()
        e.stopPropagation()
        confirmUnlink(element, onConfirm)
      }}"
    ></mwc-icon-button>
  `
}
