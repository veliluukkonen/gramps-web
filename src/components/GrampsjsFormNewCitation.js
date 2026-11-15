/*
Form for adding a new event reference
*/

import {html, css} from 'lit'
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
  static get styles() {
    return [
      super.styles,
      css`
        .new-source {
          border: 1px solid var(--grampsjs-body-font-color-25, #ccc);
          border-radius: 8px;
          padding: 8px 16px;
          margin-bottom: 16px;
        }

        .new-source mwc-textfield {
          width: 100%;
          margin: 8px 0;
        }

        .new-source .error {
          color: var(--mdc-theme-error, #b00020);
        }
      `,
    ]
  }

  static get properties() {
    return {
      ...super.properties,
      _newSourceOpen: {type: Boolean},
      _newSourceBusy: {type: Boolean},
      _newSourceError: {type: String},
    }
  }

  constructor() {
    super()
    this.data = {_class: 'Citation', confidence: 2}
    this._newSourceOpen = false
    this._newSourceBusy = false
    this._newSourceError = ''
  }

  renderForm() {
    return html`
      <h4 class="label">${this._('Source')}</h4>
      ${this._renderNewSource()}
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

  _renderNewSource() {
    if (!this._newSourceOpen) {
      return html`
        <p>
          <mwc-button
            outlined
            icon="add"
            label="${this._('Create a new source')}"
            @click="${this._openNewSource}"
          ></mwc-button>
        </p>
      `
    }
    return html`
      <div class="new-source">
        <h4 class="label">${this._('New Source')}</h4>
        <mwc-textfield
          id="new-source-title"
          label="${this._('Title')}"
          required
          @keydown="${this._handleNewSourceKey}"
        ></mwc-textfield>
        <mwc-textfield
          id="new-source-author"
          label="${this._('Author')}"
          @keydown="${this._handleNewSourceKey}"
        ></mwc-textfield>
        ${this._newSourceError
          ? html`<p class="error">${this._newSourceError}</p>`
          : ''}
        <p class="right">
          <mwc-button
            label="${this._('Cancel')}"
            ?disabled="${this._newSourceBusy}"
            @click="${this._closeNewSource}"
          ></mwc-button>
          <mwc-button
            raised
            label="${this._('Create source')}"
            ?disabled="${this._newSourceBusy}"
            @click="${this._createNewSource}"
          ></mwc-button>
        </p>
      </div>
    `
  }

  async _openNewSource() {
    this._newSourceOpen = true
    this._newSourceError = ''
    await this.updateComplete
    this.shadowRoot.querySelector('#new-source-title')?.focus()
  }

  _closeNewSource() {
    this._newSourceOpen = false
    this._newSourceError = ''
  }

  _handleNewSourceKey(e) {
    // Enter must not submit/close the dialog, it creates the source
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      this._createNewSource()
    }
  }

  async _createNewSource() {
    const title = (
      this.shadowRoot.querySelector('#new-source-title')?.value || ''
    ).trim()
    const author = (
      this.shadowRoot.querySelector('#new-source-author')?.value || ''
    ).trim()
    if (!title) {
      this._newSourceError = this._('This field is mandatory')
      return
    }
    this._newSourceBusy = true
    this._newSourceError = ''
    const resp = await this.appState.apiPost(
      '/api/sources/',
      {
        _class: 'Source',
        title,
        author,
        reporef_list: [],
      },
      // the view reloads when the citation is saved; reloading now could
      // re-render the open dialog
      {dbChanged: false}
    )
    this._newSourceBusy = false
    const source = (resp?.data || []).find(
      obj => obj.new?._class === 'Source'
    )?.new
    if (!source) {
      this._newSourceError = resp?.error || this._('Error')
      return
    }
    this._newSourceOpen = false
    // select the new source; this updates data.source_handle via formdata
    this.shadowRoot
      .querySelector('#source')
      ?.setObjects([
        {object_type: 'source', handle: source.handle, object: source},
      ])
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
    this._newSourceOpen = false
    this._newSourceError = ''
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
