/*
Form for adding a new event reference
*/

import {html} from 'lit'

import './GrampsjsFormSelectObjectList.js'
import './GrampsjsFormSelectCitations.js'
import {GrampsjsObjectForm} from './GrampsjsObjectForm.js'

class GrampsjsFormMediaRef extends GrampsjsObjectForm {
  renderForm() {
    return html`
      <grampsjs-form-select-object-list
        fixedMenuPosition
        style="min-height: 300px;"
        objectType="media"
        .appState="${this.appState}"
        id="media-select"
        label="${this._('Select')}"
        class="edit"
      ></grampsjs-form-select-object-list>

      <h4 class="label">${this._('Citations')}</h4>
      <grampsjs-form-select-citations
        id="object-citation"
        .appState="${this.appState}"
        .citationHandles="${this.data?.citation_list || []}"
      ></grampsjs-form-select-citations>
    `
  }
}

window.customElements.define('grampsjs-form-mediaref', GrampsjsFormMediaRef)
