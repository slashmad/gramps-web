import {css, html, LitElement} from 'lit'
import '@material/mwc-button'
import '@material/mwc-textfield'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent} from '../util.js'

const FIELD_LABELS = {
  BASE_URL: 'Gramps Web base URL',
  FRONTEND_URL: 'Frontend URL',
  DEFAULT_FROM_EMAIL: 'From address',
  EMAIL_HOST: 'SMTP host',
  EMAIL_PORT: 'SMTP port',
  EMAIL_HOST_USER: 'SMTP user',
  EMAIL_HOST_PASSWORD: 'SMTP password',
}

const PRIORITY_KEYS = [
  'BASE_URL',
  'FRONTEND_URL',
  'DEFAULT_FROM_EMAIL',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_HOST_USER',
  'EMAIL_HOST_PASSWORD',
]

const TYPE_HINTS = {
  bool: 'true / false',
  int: 'integer',
  float: 'decimal',
  json: 'JSON',
  duration: 'seconds or HH:MM:SS',
}

class GrampsjsConfigSettings extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          text-align: left;
          vertical-align: top;
          padding: 0.8em 0.4em;
          border-bottom: 1px solid var(--grampsjs-body-font-color-10);
        }

        th {
          min-width: 220px;
          width: 30%;
          font-weight: 450;
        }

        td.value {
          width: 45%;
        }

        td.actions {
          width: 25%;
          white-space: nowrap;
        }

        .key {
          margin-top: 0.3em;
          font-size: 13px;
          color: var(--grampsjs-body-font-color-60);
          font-family: monospace;
        }

        .status {
          margin-top: 0.45em;
          font-size: 13px;
          color: var(--grampsjs-body-font-color-60);
        }

        mwc-textfield {
          width: 100%;
        }

        mwc-textfield.filter {
          max-width: 420px;
          margin-bottom: 0.8em;
        }

        mwc-button + mwc-button {
          margin-left: 0.4em;
        }
      `,
    ]
  }

  static get properties() {
    return {
      _loading: {type: Boolean},
      _errorMessage: {type: String},
      _configData: {type: Object},
      _formData: {type: Object},
      _busyKey: {type: String},
      _filter: {type: String},
    }
  }

  constructor() {
    super()
    this._loading = true
    this._errorMessage = ''
    this._configData = {}
    this._formData = {}
    this._busyKey = ''
    this._filter = ''
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadData()
  }

  render() {
    if (this._loading) {
      return html`<p class="small">${this._('Loading items...')}</p>`
    }
    if (this._errorMessage) {
      return html`<p class="alert error">${this._errorMessage}</p>`
    }
    return html`
      <p>
        ${this._(
          'These values are stored in the database and override server configuration values.'
        )}
      </p>
      <mwc-textfield
        class="filter"
        outlined
        label="${this._('Search')}"
        icon="search"
        .value="${this._filter}"
        @input="${e => {
          this._filter = e.target.value
        }}"
      ></mwc-textfield>
      <table>
        ${this._visibleKeys.map(
          key => html`
            <tr>
              <th>
                <div>${this._(this._label(key))}</div>
                <div class="key">${key}</div>
              </th>
              <td class="value">
                <mwc-textfield
                  outlined
                  ?disabled=${this._isBusy(key) ||
                  !this.appState.permissions.canEditSettings}
                  type="${this._inputType(key)}"
                  .value="${this._formValue(key)}"
                  placeholder="${TYPE_HINTS[this._type(key)] || ''}"
                  @input="${e => this._handleInput(key, e.target.value)}"
                ></mwc-textfield>
                <div class="status">
                  ${this._isOverridden(key)
                    ? this._('Overridden in database')
                    : this._('Using server/default value')}
                </div>
              </td>
              <td class="actions">
                <mwc-button
                  outlined
                  ?disabled=${!this.appState.permissions.canEditSettings ||
                  !this._hasChanged(key) ||
                  this._isBusy()}
                  @click="${() => this._save(key)}"
                  >${this._('_Save')}</mwc-button
                >
                <mwc-button
                  ?disabled=${!this.appState.permissions.canEditSettings ||
                  !this._isOverridden(key) ||
                  this._isBusy()}
                  @click="${() => this._reset(key)}"
                  >${this._('Reset')}</mwc-button
                >
              </td>
            </tr>
          `
        )}
      </table>
    `
  }

  get _visibleKeys() {
    const q = this._filter.trim().toLowerCase()
    if (!q) {
      return this._allKeys
    }
    return this._allKeys.filter(key => {
      const label = this._label(key).toLowerCase()
      return key.toLowerCase().includes(q) || label.includes(q)
    })
  }

  get _allKeys() {
    const keySet = new Set([...PRIORITY_KEYS, ...Object.keys(this._configData)])
    const keys = [...keySet]
    keys.sort((a, b) => {
      const ia = PRIORITY_KEYS.indexOf(a)
      const ib = PRIORITY_KEYS.indexOf(b)
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      }
      return a.localeCompare(b)
    })
    return keys
  }

  _label(key) {
    return this.constructor._label(key)
  }

  static _label(key) {
    return FIELD_LABELS[key] || key
  }

  _type(key) {
    return this._configData?.[key]?.type || 'str'
  }

  _inputType(key) {
    return this.constructor._inputType(key)
  }

  static _inputType(key) {
    if (key.includes('PASSWORD')) {
      return 'password'
    }
    return 'text'
  }

  _storedValue(key) {
    return this._configData?.[key]?.value ?? ''
  }

  _formValue(key) {
    return this._formData?.[key] ?? ''
  }

  _isOverridden(key) {
    return !!this._configData?.[key]?.overridden
  }

  _hasChanged(key) {
    return this._formValue(key) !== this._storedValue(key)
  }

  _isBusy(key = '') {
    if (!this._busyKey) {
      return false
    }
    if (!key) {
      return true
    }
    return this._busyKey === key
  }

  _handleInput(key, value) {
    this._formData = {...this._formData, [key]: value}
  }

  _normalizeConfigData(rawData = {}) {
    return this.constructor._normalizeConfigData(rawData)
  }

  static _normalizeConfigData(rawData = {}) {
    const normalized = {}
    Object.keys(rawData).forEach(key => {
      const value = rawData[key]
      if (
        value &&
        typeof value === 'object' &&
        Object.prototype.hasOwnProperty.call(value, 'value')
      ) {
        normalized[key] = {
          value: `${value.value ?? ''}`,
          overridden: !!value.overridden,
          type: value.type || 'str',
        }
      } else {
        normalized[key] = {
          value: `${value ?? ''}`,
          overridden: true,
          type: 'str',
        }
      }
    })
    return normalized
  }

  async _loadData() {
    this._loading = true
    this._errorMessage = ''
    let data = await this.appState.apiGet('/api/config/?full=1')
    if ('error' in data) {
      const fallback = await this.appState.apiGet('/api/config/')
      if ('data' in fallback) {
        data = fallback
      }
    }
    if ('error' in data) {
      this._errorMessage = data.error
      this._loading = false
      return
    }
    this._configData = this._normalizeConfigData(data.data || {})
    const formData = {}
    this._allKeys.forEach(key => {
      formData[key] = this._storedValue(key)
    })
    this._formData = formData
    this._loading = false
  }

  async _save(key) {
    this._busyKey = key
    const payload = {value: this._formValue(key)}
    const res = await this.appState.apiPut(`/api/config/${key}/`, payload, {
      dbChanged: false,
    })
    this._busyKey = ''
    if ('error' in res) {
      fireEvent(this, 'grampsjs:error', {message: res.error})
      return
    }
    await this._loadData()
    fireEvent(this, 'grampsjs:notification', {message: this._('Saved')})
  }

  async _reset(key) {
    this._busyKey = key
    const res = await this.appState.apiDelete(`/api/config/${key}/`, {
      dbChanged: false,
    })
    this._busyKey = ''
    if ('error' in res) {
      fireEvent(this, 'grampsjs:error', {message: res.error})
      return
    }
    await this._loadData()
    fireEvent(this, 'grampsjs:notification', {
      message: this._('Reset to server/default value'),
    })
  }
}

window.customElements.define('grampsjs-config-settings', GrampsjsConfigSettings)
