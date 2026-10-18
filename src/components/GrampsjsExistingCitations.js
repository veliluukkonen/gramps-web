/*
Duplicate check for the "new citation" forms.

Once a source is selected and a page entered, queries /api/citations/ for
citations of the same source with the same page (debounced) and lists them.
Fires `existing-citation:changed` with {count} whenever the result changes
and `existing-citation:selected` with {handle, grampsId} when the user
chooses to use an existing citation instead of creating a new one.
*/

import {html, css, LitElement} from 'lit'
import {mdiAlertOutline, mdiOpenInNew} from '@mdi/js'

import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent} from '../util.js'
import '@material/web/button/text-button.js'
import './GrampsjsIcon.js'

const DEBOUNCE_MS = 500
const LIMIT = 10

export class GrampsjsExistingCitations extends GrampsjsAppStateMixin(
  LitElement
) {
  static get styles() {
    return [
      css`
        :host {
          display: block;
        }

        .card {
          margin: 1.5em 0;
          padding: 1em 1.2em;
          border-radius: 12px;
          background-color: var(--md-sys-color-tertiary-container, #fff3cd);
          color: var(--md-sys-color-on-tertiary-container, #5c4300);
          font-size: 0.95em;
        }

        .title {
          display: flex;
          align-items: center;
          gap: 0.5em;
          font-weight: 500;
          margin-bottom: 0.5em;
        }

        table {
          border-collapse: collapse;
          width: 100%;
        }

        td {
          padding: 0.3em 0.6em 0.3em 0;
          vertical-align: middle;
        }

        td.id {
          opacity: 0.7;
          white-space: nowrap;
        }

        td.actions {
          text-align: right;
          white-space: nowrap;
        }

        a {
          color: inherit;
        }

        md-text-button {
          --md-text-button-label-text-color: var(
            --md-sys-color-on-tertiary-container,
            #5c4300
          );
        }
      `,
    ]
  }

  static get properties() {
    return {
      sourceHandle: {type: String},
      page: {type: String},
      _citations: {type: Array},
    }
  }

  constructor() {
    super()
    this.sourceHandle = ''
    this.page = ''
    this._citations = []
    this._timer = null
    this._requestId = 0
  }

  get count() {
    return this._citations.length
  }

  render() {
    if (this._citations.length === 0) {
      return html``
    }
    return html`
      <div class="card">
        <div class="title">
          <grampsjs-icon path="${mdiAlertOutline}"></grampsjs-icon>
          ${this._('A citation with this page already exists for the source')}
        </div>
        <table>
          ${this._citations.map(citation => this._renderRow(citation))}
        </table>
      </div>
    `
  }

  _renderRow(citation) {
    return html`
      <tr>
        <td>${citation.page}</td>
        <td class="id">${citation.gramps_id}</td>
        <td>${citation.profile?.date || ''}</td>
        <td class="actions">
          <a
            href="/citation/${citation.gramps_id}"
            target="_blank"
            rel="noopener"
            title="${this._('Open in new tab')}"
          >
            <grampsjs-icon path="${mdiOpenInNew}" height="18"></grampsjs-icon>
          </a>
          <md-text-button @click="${() => this._handleSelect(citation)}">
            ${this._('Use this citation')}
          </md-text-button>
        </td>
      </tr>
    `
  }

  _handleSelect(citation) {
    fireEvent(this, 'existing-citation:selected', {
      handle: citation.handle,
      grampsId: citation.gramps_id,
    })
  }

  updated(changed) {
    if (changed.has('sourceHandle') || changed.has('page')) {
      this._scheduleFetch()
    }
  }

  _scheduleFetch() {
    clearTimeout(this._timer)
    this._timer = setTimeout(() => this._fetch(), DEBOUNCE_MS)
  }

  _setResult(citations) {
    const changed = citations.length !== this._citations.length
    this._citations = citations
    if (changed) {
      fireEvent(this, 'existing-citation:changed', {count: citations.length})
    }
  }

  reset() {
    clearTimeout(this._timer)
    this._requestId += 1
    this._setResult([])
  }

  async _fetch() {
    const page = (this.page || '').trim()
    if (!this.sourceHandle || !page) {
      this._requestId += 1
      this._setResult([])
      return
    }
    const params = new URLSearchParams({
      source_handle: this.sourceHandle,
      citation_page: page,
      profile: 'self',
      page: 1,
      pagesize: LIMIT,
    })
    this._requestId += 1
    const requestId = this._requestId
    const result = await this.appState.apiGet(
      `/api/citations/?${params.toString()}`
    )
    if (requestId !== this._requestId) {
      return // a newer request is in flight; ignore this stale answer
    }
    if ('error' in result) {
      this._setResult([])
      return
    }
    this._setResult(result.data || [])
  }
}

window.customElements.define(
  'grampsjs-existing-citations',
  GrampsjsExistingCitations
)
