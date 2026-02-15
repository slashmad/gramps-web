import {html} from 'lit'

import {GrampsjsView} from './GrampsjsView.js'
import '../components/GrampsjsConfigSettings.js'

export class GrampsjsViewServerSettings extends GrampsjsView {
  renderContent() {
    return html`
      <h3>${this._('Server configuration')}</h3>
      ${this.appState.permissions.canViewSettings
        ? html`<grampsjs-config-settings
            .appState="${this.appState}"
          ></grampsjs-config-settings>`
        : html`<p class="alert warn">
            ${this._(
              'You do not have permission to view or edit server configuration.'
            )}
          </p>`}
    `
  }
}

window.customElements.define(
  'grampsjs-view-server-settings',
  GrampsjsViewServerSettings
)
