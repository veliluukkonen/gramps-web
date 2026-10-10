/*
Live duplicate check for the "new person" form.

Queries /api/people/similar/ while the user types (debounced) and shows
the matching people when there are at most `limit` of them. Fires a
`similar:changed` event with {count} whenever the result changes so the
parent can ask for confirmation before saving.
*/

import {html, css, LitElement} from 'lit'
import {mdiAlertOutline, mdiOpenInNew} from '@mdi/js'

import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent} from '../util.js'
import '@material/web/button/text-button.js'
import './GrampsjsIcon.js'

export const SIMILAR_PEOPLE_LIMIT = 20
const DEBOUNCE_MS = 500
const MIN_SURNAME_LENGTH = 3

export class GrampsjsSimilarPeople extends GrampsjsAppStateMixin(LitElement) {
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
      firstName: {type: String},
      surname: {type: String},
      birthYear: {type: Number},
      gender: {type: Number},
      limit: {type: Number},
      _count: {type: Number},
      _people: {type: Array},
    }
  }

  constructor() {
    super()
    this.firstName = ''
    this.surname = ''
    this.birthYear = null
    this.gender = null
    this.limit = SIMILAR_PEOPLE_LIMIT
    this._count = 0
    this._people = []
    this._timer = null
    this._requestId = 0
  }

  get count() {
    return this._count
  }

  render() {
    if (this._count === 0) {
      return html``
    }
    return html`
      <div class="card">
        <div class="title">
          <grampsjs-icon path="${mdiAlertOutline}"></grampsjs-icon>
          ${this._count > this.limit
            ? this._(
                'More than %s similar people found. Refine the name.',
                this.limit
              )
            : this._count === 1
            ? this._('One similar person already exists')
            : this._('%s similar people already exist', this._count)}
        </div>
        ${this._count > this.limit
          ? ''
          : html`
              <table>
                ${this._people.map(person => this._renderRow(person))}
              </table>
            `}
      </div>
    `
  }

  _renderRow(person) {
    const profile = person.profile || {}
    const birth = profile.birth?.date || ''
    const death = profile.death?.date || ''
    const years = death ? `${birth} – ${death}` : birth
    return html`
      <tr>
        <td>${profile.name_display || person.gramps_id}</td>
        <td class="id">${person.gramps_id}</td>
        <td>${years}</td>
        <td class="actions">
          <a
            href="/person/${person.gramps_id}"
            target="_blank"
            rel="noopener"
            title="${this._('Open in new tab')}"
          >
            <grampsjs-icon path="${mdiOpenInNew}" height="18"></grampsjs-icon>
          </a>
          <md-text-button @click="${() => this._handleSamePerson(person)}">
            ${this._('This is the same person')}
          </md-text-button>
        </td>
      </tr>
    `
  }

  _handleSamePerson(person) {
    fireEvent(this, 'similar:selected', {grampsId: person.gramps_id})
  }

  updated(changed) {
    if (
      changed.has('firstName') ||
      changed.has('surname') ||
      changed.has('birthYear') ||
      changed.has('gender')
    ) {
      this._scheduleFetch()
    }
  }

  _scheduleFetch() {
    clearTimeout(this._timer)
    this._timer = setTimeout(() => this._fetch(), DEBOUNCE_MS)
  }

  _setResult(count, people) {
    const changed = count !== this._count
    this._count = count
    this._people = people
    if (changed) {
      fireEvent(this, 'similar:changed', {count})
    }
  }

  reset() {
    clearTimeout(this._timer)
    this._requestId += 1
    this._setResult(0, [])
  }

  async _fetch() {
    const surname = (this.surname || '').trim()
    const firstName = (this.firstName || '').trim()
    if (surname.length < MIN_SURNAME_LENGTH) {
      this._setResult(0, [])
      return
    }
    const params = new URLSearchParams({
      surname,
      first_name: firstName,
      limit: this.limit,
    })
    if (this.birthYear) {
      params.set('birth_year', this.birthYear)
    }
    if (
      this.gender !== null &&
      this.gender !== undefined &&
      this.gender !== 2
    ) {
      params.set('gender', this.gender)
    }
    this._requestId += 1
    const requestId = this._requestId
    const result = await this.appState.apiGet(
      `/api/people/similar/?${params.toString()}`
    )
    if (requestId !== this._requestId) {
      return // a newer request is in flight; ignore this stale answer
    }
    if ('error' in result) {
      this._setResult(0, [])
      return
    }
    const count = parseInt(result.total_count ?? '0', 10) || 0
    this._setResult(count, result.data || [])
  }
}

window.customElements.define('grampsjs-similar-people', GrampsjsSimilarPeople)
