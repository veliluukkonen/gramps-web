/*
Marker for objects (events in particular) that have citations.

Renders a small bookmark icon when `citations` (a list of citation handles)
is non-empty. Clicking it opens the citation page directly; when there are
several citations a menu lists them by source title and page.
Click events never reach the surrounding row, so a list row that navigates
to the event on click keeps working.
*/

import {html, css, LitElement} from 'lit'
import {mdiBookmarkOutline, mdiBookmarkMultipleOutline} from '@mdi/js'
import '@material/web/menu/menu'
import '@material/web/menu/menu-item'

import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent} from '../util.js'
import './GrampsjsIcon.js'

let instanceCounter = 0

export class GrampsjsCitationLink extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      css`
        :host {
          display: inline-block;
          vertical-align: middle;
        }

        .wrapper {
          position: relative;
          display: inline-block;
        }

        button {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          border: none;
          background: none;
          padding: 2px 4px;
          margin: 0;
          border-radius: 12px;
          cursor: pointer;
          color: var(--grampsjs-body-font-color-40);
          font: inherit;
          font-size: 0.8em;
          line-height: 1;
        }

        button:hover {
          background-color: rgba(0, 0, 0, 0.06);
        }

        md-menu {
          min-width: 240px;
        }
      `,
    ]
  }

  static get properties() {
    return {
      citations: {type: Array},
      _items: {type: Array},
    }
  }

  constructor() {
    super()
    this.citations = []
    this._items = []
    instanceCounter += 1
    this._buttonId = `citation-link-${instanceCounter}`
  }

  render() {
    const count = this.citations?.length || 0
    if (count === 0) {
      return html``
    }
    return html`
      <span class="wrapper">
        <button
          id="${this._buttonId}"
          type="button"
          title="${this._('Citations')}"
          aria-label="${this._('Citations')}"
          @click="${this._handleClick}"
        >
          <grampsjs-icon
            path="${count > 1
              ? mdiBookmarkMultipleOutline
              : mdiBookmarkOutline}"
            height="18"
            width="18"
          ></grampsjs-icon>
          ${count > 1 ? html`<span class="count">${count}</span>` : ''}
        </button>
        ${count > 1
          ? html`
              <md-menu
                id="menu"
                positioning="popover"
                @click="${this._stop}"
                anchor="${this._buttonId}"
                anchor-corner="end-end"
                menu-corner="start-end"
              >
                ${this._items.map(
                  item => html`
                    <md-menu-item @click="${() => this._open(item.grampsId)}">
                      <div slot="headline">${item.title}</div>
                      ${item.page
                        ? html`<div slot="supporting-text">${item.page}</div>`
                        : ''}
                    </md-menu-item>
                  `
                )}
              </md-menu>
            `
          : ''}
      </span>
    `
  }

  // Keep menu clicks from reaching the row, which would navigate elsewhere.
  // eslint-disable-next-line class-methods-use-this
  _stop(e) {
    e.stopPropagation()
  }

  async _handleClick(e) {
    e.stopPropagation()
    e.preventDefault()
    if (this.citations.length === 1) {
      const items = await this._fetchItems()
      if (items.length === 1) {
        this._open(items[0].grampsId)
      }
      return
    }
    if (this._items.length === 0) {
      this._items = await this._fetchItems()
    }
    const menu = this.shadowRoot.getElementById('menu')
    if (menu) {
      menu.open = !menu.open
    }
  }

  async _fetchItems() {
    const results = await Promise.all(
      this.citations.map(handle =>
        this.appState.apiGet(`/api/citations/${handle}?extend=source_handle`)
      )
    )
    return results
      .filter(res => 'data' in res)
      .map(res => ({
        grampsId: res.data.gramps_id,
        title: res.data?.extended?.source?.title || this._('Citation'),
        page: res.data.page || '',
      }))
  }

  _open(grampsId) {
    if (grampsId) {
      fireEvent(this, 'nav', {path: `citation/${grampsId}`})
    }
  }
}

window.customElements.define('grampsjs-citation-link', GrampsjsCitationLink)
