/*
Component showing the relationship string for two people by handle
*/

import {html} from 'lit'
import {GrampsjsConnectedComponent} from './GrampsjsConnectedComponent.js'

export class GrampsjsPersonRelationship extends GrampsjsConnectedComponent {
  static get properties() {
    return {
      person1: {type: String},
      person2: {type: String},
    }
  }

  constructor() {
    super()
    this.person1 = ''
    this.person2 = ''
  }

  getUrl() {
    const includeAssociations =
      this.appState?.settings?.relationshipIncludeAssociations ?? true
    const bridgeQuery = includeAssociations
      ? '&include_associations=1&include_partner_links=1'
      : ''
    return `/api/relations/${this.person1}/${this.person2}?depth=20&locale=${
      this.appState.i18n.lang || 'en'
    }${bridgeQuery}`
  }

  // eslint-disable-next-line class-methods-use-this
  renderLoading() {
    return html`<span class="skeleton" style="width:7em;">&nbsp;</span>`
  }

  renderContent() {
    const relation = this._data?.data?.relationship_string
    const associationVia = this._data?.data?.association_via
    if (this.person1 === this.person2) {
      return html`${this._('self')}`
    }
    if (relation === undefined) {
      return html`&nbsp;`
    }
    if (relation === '') {
      if (associationVia?.name_display) {
        return html`${this._('Acquainted through')} ${associationVia.name_display}`
      }
      return html`${this._('Not Related')}`
    }
    return html`${relation}`
  }
}

window.customElements.define(
  'grampsjs-person-relationship',
  GrampsjsPersonRelationship
)
