/*
Citation picker for add forms: select existing citations or create a new
one (with a new source and a note) without leaving the form.

The selected handles are reported like with grampsjs-form-select-object-list
(formdata:changed from the inner element with id `${this.id}-list`).
*/

import {html, LitElement} from 'lit'
import '@material/mwc-button'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent} from '../util.js'
import {postCitationWithNote} from '../citationApi.js'
import './GrampsjsFormSelectObjectList.js'
import './GrampsjsFormNewCitation.js'

class GrampsjsFormSelectCitations extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [sharedStyles]
  }

  static get properties() {
    return {
      _dialogOpen: {type: Boolean},
    }
  }

  constructor() {
    super()
    this._dialogOpen = false
  }

  render() {
    return html`
      <grampsjs-form-select-object-list
        multiple
        id="${this.id}"
        objectType="citation"
        .appState="${this.appState}"
      ></grampsjs-form-select-object-list>
      <p>
        <mwc-button
          outlined
          icon="add"
          label="${this._('New Citation')}"
          @click="${this._openDialog}"
        ></mwc-button>
      </p>
      <div
        @formdata:changed="${this._stop}"
        @object:save="${this._handleSave}"
        @object:cancel="${this._handleCancel}"
        @citation:existing="${this._handleExisting}"
      >
        ${this._dialogOpen
          ? html`<grampsjs-form-new-citation
              new
              .appState="${this.appState}"
              dialogTitle="${this._('New Citation')}"
            ></grampsjs-form-new-citation>`
          : ''}
      </div>
    `
  }

  // events of the nested dialog must not reach the surrounding form
  // eslint-disable-next-line class-methods-use-this
  _stop(e) {
    e.stopPropagation()
  }

  _openDialog() {
    this._dialogOpen = true
  }

  _handleCancel(e) {
    e.stopPropagation()
    this._dialogOpen = false
  }

  async _handleSave(e) {
    e.preventDefault()
    e.stopPropagation()
    this._dialogOpen = false
    // the surrounding view reloads when the main object is saved
    const res = await postCitationWithNote(this.appState, e.detail.data, {
      dbChanged: false,
    })
    if ('error' in res) {
      fireEvent(this, 'grampsjs:error', {message: res.error})
      return
    }
    await this._addCitation(res.handle)
  }

  async _handleExisting(e) {
    e.stopPropagation()
    this._dialogOpen = false
    await this._addCitation(e.detail.handle)
  }

  async _addCitation(handle) {
    const list = this.shadowRoot.querySelector(
      'grampsjs-form-select-object-list'
    )
    const current = list.getObjects()
    if (current.some(obj => obj.handle === handle)) {
      return
    }
    const resp = await this.appState.apiGet(
      `/api/citations/${handle}?profile=all&locale=${
        this.appState.i18n.lang || 'en'
      }`
    )
    const object = 'data' in resp ? resp.data : {handle}
    list.setObjects([...current, {object_type: 'citation', handle, object}])
  }

  reset() {
    this._dialogOpen = false
    this.shadowRoot?.querySelector('grampsjs-form-select-object-list')?.reset()
  }
}

window.customElements.define(
  'grampsjs-form-select-citations',
  GrampsjsFormSelectCitations
)
