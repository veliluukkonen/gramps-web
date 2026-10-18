/*
Form for adding a new event reference
*/

import {html} from 'lit'
import '@material/mwc-textfield'
import '@material/mwc-icon-button'
import '@material/mwc-icon'
import '@material/mwc-button'

import './GrampsjsFormSelectType.js'
import './GrampsjsFormSelectObjectList.js'
import './GrampsjsFormString.js'
import './GrampsjsExistingCitations.js'
import {GrampsjsObjectForm} from './GrampsjsObjectForm.js'
import {fireEvent} from '../util.js'

const confidence = {
  0: 'Very Low',
  1: 'Low',
  2: 'Normal',
  3: 'High',
  4: 'Very High',
}

class GrampsjsFormNewCitation extends GrampsjsObjectForm {
  constructor() {
    super()
    this.data = {_class: 'Citation', confidence: 2}
  }

  renderForm() {
    return html`
      <h4 class="label">${this._('Source')}</h4>
      <grampsjs-form-select-object-list
        fixedMenuPosition
        style="min-height: 300px;"
        id="source"
        objectType="source"
        .appState="${this.appState}"
      ></grampsjs-form-select-object-list>

      <h4 class="label">${this._('Page')}</h4>
      <p>
        <grampsjs-form-string fullwidth id="page"></grampsjs-form-string>
      </p>

      <grampsjs-existing-citations
        id="existing-citations"
        .appState="${this.appState}"
        sourceHandle="${this.data.source_handle || ''}"
        page="${this.data.page || ''}"
        @existing-citation:selected="${this._handleExistingSelected}"
      ></grampsjs-existing-citations>

      <h4 class="label">${this._('Date')}</h4>
      <p>
        <grampsjs-form-select-date id="date" .appState="${this.appState}">
        </grampsjs-form-select-date>
      </p>

      <h4 class="label">${this._('Confidence')}</h4>
      <mwc-select
        id="select-confidence"
        @change="${this.handleConfidence}"
        fixedMenuPosition
      >
        ${Object.keys(confidence).map(
          conf => html`
            <mwc-list-item
              value="${conf}"
              ?selected="${
                // eslint-disable-next-line eqeqeq
                conf == this.data.confidence
              }"
              >${this._(confidence[conf])}</mwc-list-item
            >
          `
        )}
      </mwc-select>

      <div class="spacer"></div>
      <grampsjs-form-private
        id="private"
        .appState="${this.appState}"
      ></grampsjs-form-private>
    `
  }

  handleConfidence(e) {
    this.data = {...this.data, confidence: parseInt(e.target.value, 10)}
  }

  _handleExistingSelected(e) {
    // Link the existing citation instead of creating a duplicate.
    fireEvent(this, 'citation:existing', {handle: e.detail.handle})
    this._reset()
  }

  _reset() {
    super._reset()
    this.data = {_class: 'Citation', confidence: 2}
    this.shadowRoot?.querySelector('#existing-citations')?.reset()
  }

  get isValid() {
    if (!this.data.source_handle) {
      return false
    }
    return this._areDateSelectValid()
  }
}

window.customElements.define(
  'grampsjs-form-new-citation',
  GrampsjsFormNewCitation
)
