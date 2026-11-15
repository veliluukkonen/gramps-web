/*
element for editing a name
*/

import {html, css, LitElement} from 'lit'
import '@material/mwc-textfield'
import '@material/mwc-icon-button'
import '@material/mwc-icon'

import {classMap} from 'lit/directives/class-map.js'
import {sharedStyles} from '../SharedStyles.js'
import {fireEvent} from '../util.js'
import './GrampsjsFormString.js'
import './GrampsjsFormSurname.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'

class GrampsjsFormName extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-textfield.fullwidth {
          width: 100%;
        }

        .clear {
          clear: both;
          margin-bottom: 2.5em;
        }

        .hide {
          display: none;
        }

        mwc-icon-button {
          color: var(--grampsjs-body-font-color-50);
        }
      `,
    ]
  }

  static get properties() {
    return {
      data: {type: Object},
      showMore: {type: Boolean},
      loadingTypes: {type: Boolean},
      types: {type: Object},
      typesLocale: {type: Object},
      origintype: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.data = {_class: 'Name'}
    this.showMore = false
    this.types = {}
    this.typesLocale = {}
    this.loadingTypes = false
    this.origintype = false
  }

  render() {
    return html`
      <p class="${classMap({hide: !this.showMore})}">
        <grampsjs-form-string
          @formdata:changed="${this._handleFormData}"
          fullwidth
          id="title"
          value="${this.data.title || ''}"
          label="${this._('Title')}"
        ></grampsjs-form-string>
      </p>
      <p>
        <grampsjs-form-string
          @formdata:changed="${this._handleFormData}"
          fullwidth
          id="first_name"
          value="${this.data.first_name || ''}"
          label="${this._('Given name')}"
        ></grampsjs-form-string>
      </p>
      <p class="${classMap({hide: !this.showMore})}">
        <grampsjs-form-string
          @formdata:changed="${this._handleFormData}"
          fullwidth
          id="suffix"
          value="${this.data.suffix || ''}"
          label="${this._('Suffix')}"
        ></grampsjs-form-string>
      </p>
      <p class="${classMap({hide: !this.showMore})}">
        <grampsjs-form-string
          @formdata:changed="${this._handleFormData}"
          fullwidth
          id="call"
          value="${this.data.call || ''}"
          label="${this._('Call name')}"
        ></grampsjs-form-string>
      </p>
      <p class="${classMap({hide: !this.showMore})}">
        <grampsjs-form-string
          @formdata:changed="${this._handleFormData}"
          fullwidth
          id="nick"
          value="${this.data.nick || ''}"
          label="${this._('Nick name')}"
        ></grampsjs-form-string>
      </p>
      <p class="${classMap({hide: !this.showMore})}">
        <grampsjs-form-string
          @formdata:changed="${this._handleFormData}"
          fullwidth
          id="famnick"
          value="${this.data.famnick || ''}"
          label="${this._('Family nick name')}"
        ></grampsjs-form-string>
      </p>

      <div class="clear"></div>

      <h4 class="label ${classMap({hide: !this.showMore})}">
        ${this._('Surnames')}
      </h4>
      ${(this.data.surname_list || [{}]).map(
        (obj, i) => html`
          <mwc-icon-button
            ?disabled="${!this.data?.surname_list ||
            this.data?.surname_list?.length === 1}"
            class="edit ${classMap({hide: !this.showMore})}"
            icon="delete"
            @click="${() => this._handleDeleteSurname(i)}"
          ></mwc-icon-button>

          <mwc-icon-button
            ?disabled="${!this.data?.surname_list || i === 0}"
            class="edit ${classMap({hide: !this.showMore})}"
            icon="arrow_upward"
            @click="${() => this._handleUpSurname(i)}"
          ></mwc-icon-button>

          <mwc-icon-button
            ?disabled="${!this.data?.surname_list ||
            i === this.data?.surname_list?.length - 1}"
            class="edit ${classMap({hide: !this.showMore})}"
            icon="arrow_downward"
            @click="${() => this._handleDownSurname(i)}"
          ></mwc-icon-button>

          <grampsjs-form-surname
            ?origintype="${this.origintype}"
            ?showMore="${this.showMore}"
            id="surnames${i}"
            idx="${i}"
            @formdata:changed="${this._handleFormData}"
            .appState="${this.appState}"
            .data="${obj}"
            .types="${this.types}"
            ?loadingTypes=${this.loadingTypes}
            .typesLocale="${this.typesLocale}"
          >
          </grampsjs-form-surname>
          <hr />
        `
      )}
      <p class="${classMap({hide: !this.showMore})}">
        <mwc-icon-button
          @click="${this._handleAddSurname}"
          icon="add"
        ></mwc-icon-button>
      </p>

      ${this.showMore
        ? ''
        : html`
            <mwc-icon-button
              class="edit"
              id="button-show-more"
              @click="${this._handleShowMore}"
              icon="more_horiz"
            ></mwc-icon-button>
            <grampsjs-tooltip
              for="button-show-more"
              .appState="${this.appState}"
              >${this._('Show more')}</grampsjs-tooltip
            >
          `}
    `
  }

  _handleShowMore() {
    this.showMore = true
  }

  reset() {
    this.shadowRoot
      .querySelectorAll('grampsjs-form-string')
      .forEach(element => element.reset())
    this.shadowRoot.querySelector('grampsjs-form-surname').reset()
    this.showMore = false
    this.data = {_class: 'Name'}
  }

  handleChange() {
    fireEvent(this, 'formdata:changed', {data: this.data})
  }

  // add/delete/move must notify the form, otherwise a change consisting only
  // of these actions is not saved (and the save button stays disabled)
  _setSurnameList(surnameList) {
    this.data = {...this.data, surname_list: surnameList}
    this.handleChange()
  }

  _handleAddSurname() {
    this._setSurnameList([...(this.data.surname_list || [{}]), {}])
  }

  _handleDeleteSurname(i) {
    this._setSurnameList(
      (this.data.surname_list || []).filter((_, j) => j !== i)
    )
  }

  _handleUpSurname(i) {
    this._setSurnameList(this.moveItem(this.data.surname_list, i, i - 1))
  }

  _handleDownSurname(i) {
    this._setSurnameList(this.moveItem(this.data.surname_list, i, i + 1))
  }

  _handleFormData(e) {
    const originalTarget = e.composedPath()[0]
    if (
      ['first_name', 'call', 'nick', 'famnick', 'title', 'suffix'].includes(
        originalTarget.id
      )
    ) {
      this.data = {...this.data, [originalTarget.id]: e.detail.data}
    } else if (originalTarget.id.startsWith('surnames')) {
      const i = e.detail.idx
      const surnameList = this.data.surname_list || []
      this.data = {
        ...this.data,
        surname_list: [
          ...surnameList.slice(0, i),
          e.detail.data,
          ...surnameList.slice(i + 1),
        ],
      }
    }
    e.stopPropagation()
    this.handleChange()
  }

  // returns a moved copy (the list may be shared with the saved object)
  moveItem = (array, from, to) => {
    const result = [...(array || [])]
    const [item] = result.splice(from, 1)
    result.splice(to, 0, item)
    return result
  }
}

window.customElements.define('grampsjs-form-name', GrampsjsFormName)
