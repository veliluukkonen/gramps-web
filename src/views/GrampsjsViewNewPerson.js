import {html} from 'lit'
import '@material/web/dialog/dialog.js'
import '@material/web/button/text-button.js'

import {GrampsjsViewNewObject} from './GrampsjsViewNewObject.js'
import {GrampsjsNewPersonMixin} from '../mixins/GrampsjsNewPersonMixin.js'

export class GrampsjsViewNewPerson extends GrampsjsNewPersonMixin(
  GrampsjsViewNewObject
) {
  static get properties() {
    return {
      _confirmOpen: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.postUrl = '/api/objects/'
    this.itemPath = 'person'
    this.objClass = 'Person'
    this._confirmOpen = false
  }

  renderContent() {
    return html`
      <h2>${this._('New Person')}</h2>
      ${this.renderForm()} ${this.renderButtons()}
      ${this._renderConfirmDialog()}
    `
  }

  _renderConfirmDialog() {
    if (!this._confirmOpen) {
      return ''
    }
    return html`
      <md-dialog open @cancel="${e => e.preventDefault()}">
        <div slot="content">
          ${this._(
            '%s similar people already exist. Do you want to add this person anyway?',
            this.similarCount
          )}
        </div>
        <div slot="actions">
          <md-text-button
            @click="${() => {
              this._confirmOpen = false
            }}"
          >
            ${this._('Cancel')}
          </md-text-button>
          <md-text-button
            @click="${() => {
              this._confirmOpen = false
              this._submitConfirmed()
            }}"
          >
            ${this._('Add anyway')}
          </md-text-button>
        </div>
      </md-dialog>
    `
  }

  _submit() {
    if (this.similarCount > 0) {
      this._confirmOpen = true
      return
    }
    this._submitConfirmed()
  }

  _submitConfirmed() {
    const processedData = this._processedData()
    this.appState.apiPost(this.postUrl, processedData).then(data => {
      if ('data' in data) {
        this.error = false
        const grampsId = data.data.filter(obj => obj.new._class === 'Person')[0]
          .new.gramps_id
        this.dispatchEvent(
          new CustomEvent('nav', {
            bubbles: true,
            composed: true,
            detail: {path: this._getItemPath(grampsId)},
          })
        )
        this._reset()
      } else if ('error' in data) {
        this.error = true
        this._errorMessage = data.error
      }
    })
  }
}

window.customElements.define('grampsjs-view-new-person', GrampsjsViewNewPerson)
