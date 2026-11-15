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
import './GrampsjsFormSelectCitations.js'
import {GrampsjsObjectForm} from './GrampsjsObjectForm.js'

class GrampsjsFormChildRef extends GrampsjsObjectForm {
  renderForm() {
    return html`
      <grampsjs-form-select-object-list
        fixedMenuPosition
        style="min-height: 300px;"
        objectType="person"
        .appState="${this.appState}"
        id="child-select"
        label="${this._('Select')}"
        class="edit"
      ></grampsjs-form-select-object-list>
      <grampsjs-form-select-type
        required
        id="child-frel"
        heading="${this._('Relationship to _Father:').replace(':', '')}"
        .appState="${this.appState}"
        ?loadingTypes=${this.loadingTypes}
        typeName="child_reference_types"
        defaultValue="Birth"
        .types="${this.types}"
        .typesLocale="${this.typesLocale}"
      >
      </grampsjs-form-select-type>
      <grampsjs-form-select-type
        required
        id="child-mrel"
        heading="${this._('Relationship to _Mother:').replace(':', '')}"
        .appState="${this.appState}"
        ?loadingTypes=${this.loadingTypes}
        typeName="child_reference_types"
        defaultValue="Birth"
        .types="${this.types}"
        .typesLocale="${this.typesLocale}"
      >
      </grampsjs-form-select-type>

      <h4 class="label">${this._('Citations')}</h4>
      <grampsjs-form-select-citations
        id="object-citation"
        .appState="${this.appState}"
        .citationHandles="${this.data?.citation_list || []}"
      ></grampsjs-form-select-citations>
    `
  }
}

window.customElements.define('grampsjs-form-childref', GrampsjsFormChildRef)
