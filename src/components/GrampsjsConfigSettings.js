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
  REQUEST_CACHE_CONFIG: 'Request cache config',
  THUMBNAIL_CACHE_CONFIG: 'Thumbnail cache config',
  PERSISTENT_CACHE_CONFIG: 'Persistent cache config',
  REPORT_DIR: 'Report directory',
  EXPORT_DIR: 'Export directory',
  DISABLE_TELEMETRY: 'Disable telemetry',
  RATE_LIMIT_MEDIA_ARCHIVE: 'Media archive rate limit',
  CELERY_CONFIG: 'Celery queue config',
  LOG_LEVEL: 'Log level',
}

const FIELD_DESCRIPTIONS = {
  BASE_URL: 'Used in generated links and e-mails to point users to your server.',
  FRONTEND_URL: 'Public URL to the web UI.',
  DEFAULT_FROM_EMAIL: 'Sender address shown in outgoing e-mails.',
  EMAIL_HOST: 'SMTP server hostname.',
  EMAIL_PORT: 'SMTP server port.',
  EMAIL_HOST_USER: 'SMTP username used for authentication.',
  EMAIL_HOST_PASSWORD: 'SMTP password used for authentication.',
  EMAIL_USE_SSL: 'Use implicit SSL/TLS for SMTP connection.',
  EMAIL_USE_STARTTLS: 'Use STARTTLS upgrade on SMTP connection.',
  EMAIL_USE_TLS:
    'Legacy SMTP TLS flag. Prefer EMAIL_USE_SSL or EMAIL_USE_STARTTLS.',
  TREE: 'Tree mode. Use a fixed tree id or "*" for multi-tree mode.',
  USER_DB_URI: 'Connection string for the user/config database.',
  SECRET_KEY: 'Server secret used for cryptographic signing.',
  STATIC_PATH: 'Filesystem path for served frontend static files.',
  REGISTRATION_DISABLED: 'Disable public user registration endpoints.',
  LOG_LEVEL: 'Server logging verbosity.',
  MEDIA_BASE_DIR: 'Base directory where media files are stored.',
  MEDIA_PREFIX_TREE: 'Prefix media paths with tree id in multi-tree setups.',
  SEARCH_INDEX_DB_URI: 'Location/URI of the full-text search index database.',
  SEARCH_INDEX_DIR: 'Deprecated legacy search index directory setting.',
  REQUEST_CACHE_CONFIG: 'Request-level cache backend and limits.',
  THUMBNAIL_CACHE_CONFIG: 'Thumbnail cache backend and limits.',
  PERSISTENT_CACHE_CONFIG: 'Persistent cache backend and limits.',
  REPORT_DIR: 'Directory for temporary/generated reports.',
  EXPORT_DIR: 'Directory for exported files.',
  DISABLE_TELEMETRY: 'Disable anonymous telemetry sending.',
  LLM_BASE_URL: 'Base URL for the configured LLM provider endpoint.',
  LLM_MODEL: 'LLM model name used for AI chat.',
  LLM_MAX_CONTEXT_LENGTH: 'Maximum context length for AI prompts.',
  LLM_SYSTEM_PROMPT: 'System prompt prepended to AI chat requests.',
  VECTOR_EMBEDDING_MODEL: 'Embedding model name for semantic search.',
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

const CONFIG_GROUPS = [
  {
    id: 'email',
    label: 'Email / SMTP',
    matches: key => key === 'DEFAULT_FROM_EMAIL' || key.startsWith('EMAIL_'),
  },
  {
    id: 'urls',
    label: 'URLs / Frontend',
    matches: key =>
      ['BASE_URL', 'FRONTEND_URL', 'STATIC_PATH'].includes(key) ||
      key.startsWith('CORS_'),
  },
  {
    id: 'auth',
    label: 'Authentication / Security',
    matches: key =>
      ['SECRET_KEY', 'REGISTRATION_DISABLED'].includes(key) ||
      key.startsWith('JWT_') ||
      key.startsWith('OIDC_'),
  },
  {
    id: 'tree',
    label: 'Tree / Database / Media',
    matches: key =>
      [
        'TREE',
        'USER_DB_URI',
        'NEW_DB_BACKEND',
        'MEDIA_BASE_DIR',
        'MEDIA_PREFIX_TREE',
        'IGNORE_DB_LOCK',
      ].includes(key) || key.startsWith('POSTGRES_'),
  },
  {
    id: 'searchAi',
    label: 'Search / AI',
    matches: key =>
      key.startsWith('SEARCH_') ||
      key.startsWith('LLM_') ||
      key.startsWith('VECTOR_'),
  },
  {
    id: 'runtime',
    label: 'Runtime / Cache / Performance',
    matches: key =>
      key.includes('CACHE') ||
      key.startsWith('RATE_LIMIT_') ||
      key === 'LOG_LEVEL' ||
      key === 'DISABLE_TELEMETRY' ||
      key === 'REPORT_DIR' ||
      key === 'EXPORT_DIR' ||
      key.startsWith('CELERY_'),
  },
]

const OTHER_GROUP = {
  id: 'other',
  label: 'Other settings',
}

class GrampsjsConfigSettings extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
        }

        .group {
          border: 1px solid var(--grampsjs-body-font-color-10);
          border-radius: 8px;
          margin-bottom: 0.8em;
          background: var(--grampsjs-body-background, transparent);
        }

        summary {
          cursor: pointer;
          list-style: none;
          padding: 0.7em 0.9em;
          font-weight: 500;
          border-bottom: 1px solid var(--grampsjs-body-font-color-10);
        }

        summary::-webkit-details-marker {
          display: none;
        }

        summary::before {
          content: '▸';
          margin-right: 0.55em;
          display: inline-block;
          transition: transform 0.15s ease;
        }

        details[open] > summary::before {
          transform: rotate(90deg);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        .group table {
          margin: 0;
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

        .desc {
          margin-top: 0.3em;
          font-size: 13px;
          color: var(--grampsjs-body-font-color-70);
          line-height: 1.35;
        }

        .status {
          margin-top: 0.45em;
          font-size: 13px;
          color: var(--grampsjs-body-font-color-60);
        }

        .save-status {
          margin-top: 0.35em;
          font-size: 13px;
          line-height: 1.3;
        }

        .save-status.ok {
          color: #1b7f3a;
        }

        .save-status.error {
          color: #b00020;
        }

        .summary {
          margin: 0 0 0.9em 0;
          padding: 0.75em 0.9em;
          border: 1px solid var(--grampsjs-body-font-color-15);
          border-radius: 8px;
          background: var(--grampsjs-body-background, transparent);
          font-size: 14px;
          color: var(--grampsjs-body-font-color-75);
        }

        .summary p {
          margin: 0.3em 0;
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
      _saveStatus: {type: Object},
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
    this._saveStatus = {}
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
      <div class="summary">
        <p>
          ${this._(
            'Save writes a database override. Reset removes the override and returns to server/default value.'
          )}
        </p>
        <p>
          ${this._(
            'Status: OK means the last save/reset succeeded. Not saved means the last action failed.'
          )}
        </p>
        <p>
          ${this._(
            'Most settings apply live. Some startup/runtime settings may still require an app restart.'
          )}
        </p>
      </div>
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
      ${this._groupedVisibleKeys.map(
        group => html`
          <details class="group" ?open="${this._isGroupOpen(group.id)}">
            <summary>${this._(group.label)} (${group.keys.length})</summary>
            <table>
              ${group.keys.map(
                key => html`
                  <tr>
                    <th>
                      <div>${this._displayLabel(key)}</div>
                      <div class="key">${key}</div>
                      <div class="desc">${this._(this._description(key))}</div>
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
                      ${this._renderSaveStatus(key)}
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
          </details>
        `
      )}
    `
  }

  get _filteredKeys() {
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
    return [...keySet]
  }

  get _groupedVisibleKeys() {
    const groups = CONFIG_GROUPS.map(group => ({...group, keys: []}))
    const fallback = {...OTHER_GROUP, keys: []}
    const map = new Map(groups.map(group => [group.id, group]))
    map.set(fallback.id, fallback)

    this._filteredKeys.forEach(key => {
      const group = CONFIG_GROUPS.find(def => def.matches(key))
      map.get(group?.id || OTHER_GROUP.id).keys.push(key)
    })

    return [...groups, fallback]
      .map(group => ({
        ...group,
        keys: group.keys.sort((a, b) => b.localeCompare(a)),
      }))
      .filter(group => group.keys.length > 0)
  }

  _label(key) {
    return this.constructor._label(key)
  }

  _displayLabel(key) {
    const label = this._label(key)
    return FIELD_LABELS[key] ? this._(label) : label
  }

  static _label(key) {
    return FIELD_LABELS[key] || key
  }

  _description(key) {
    return this.constructor._description(key)
  }

  static _description(key) {
    if (FIELD_DESCRIPTIONS[key]) {
      return FIELD_DESCRIPTIONS[key]
    }
    if (key.startsWith('JWT_')) {
      return 'JWT authentication/session setting.'
    }
    if (key.startsWith('OIDC_')) {
      return 'OpenID Connect login/provider setting.'
    }
    if (key.startsWith('EMAIL_')) {
      return 'Outgoing e-mail (SMTP) setting.'
    }
    if (key.startsWith('CORS_')) {
      return 'Cross-origin request policy setting.'
    }
    if (key.startsWith('POSTGRES_')) {
      return 'PostgreSQL connection setting used by database backends.'
    }
    if (key.includes('CACHE')) {
      return 'Cache behavior and storage setting.'
    }
    if (key.startsWith('SEARCH_')) {
      return 'Search/indexing behavior setting.'
    }
    if (key.startsWith('LLM_') || key.startsWith('VECTOR_')) {
      return 'AI/semantic search integration setting.'
    }
    if (key.startsWith('RATE_LIMIT_')) {
      return 'Rate-limiting policy setting.'
    }
    if (key.endsWith('_DIR') || key.endsWith('_PATH')) {
      return 'Filesystem path/directory setting.'
    }
    if (key.endsWith('_URI') || key.endsWith('_URL')) {
      return 'Network endpoint/URI setting.'
    }
    return 'Server behavior setting.'
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

  _isGroupOpen(groupId) {
    if (this._filter.trim()) {
      return true
    }
    return ['email', 'urls'].includes(groupId)
  }

  _renderSaveStatus(key) {
    const status = this._saveStatus[key]
    if (!status) {
      return ''
    }
    const cls = status.ok ? 'ok' : 'error'
    return html`<div class="save-status ${cls}">
      ${status.ok ? this._('OK') : this._('Not saved')}
      ${status.message ? html`<div>${status.message}</div>` : ''}
    </div>`
  }

  _setSaveStatus(key, ok, message = '') {
    this._saveStatus = {
      ...this._saveStatus,
      [key]: {ok, message},
    }
  }

  _clearSaveStatus(key) {
    if (!Object.prototype.hasOwnProperty.call(this._saveStatus, key)) {
      return
    }
    const copy = {...this._saveStatus}
    delete copy[key]
    this._saveStatus = copy
  }

  static _errorText(error) {
    if (!error) {
      return ''
    }
    if (typeof error === 'string') {
      return error
    }
    if (typeof error === 'object' && 'message' in error) {
      return error.message
    }
    return `${error}`
  }

  _handleInput(key, value) {
    this._clearSaveStatus(key)
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
      this._setSaveStatus(
        key,
        false,
        this.constructor._errorText(res.error)
      )
      fireEvent(this, 'grampsjs:error', {message: res.error})
      return
    }
    await this._loadData()
    this._setSaveStatus(key, true, '')
    fireEvent(this, 'grampsjs:notification', {message: this._('Saved')})
  }

  async _reset(key) {
    this._busyKey = key
    const res = await this.appState.apiDelete(`/api/config/${key}/`, {
      dbChanged: false,
    })
    this._busyKey = ''
    if ('error' in res) {
      this._setSaveStatus(
        key,
        false,
        this.constructor._errorText(res.error)
      )
      fireEvent(this, 'grampsjs:error', {message: res.error})
      return
    }
    await this._loadData()
    this._setSaveStatus(key, true, '')
    fireEvent(this, 'grampsjs:notification', {
      message: this._('Reset to server/default value'),
    })
  }
}

window.customElements.define('grampsjs-config-settings', GrampsjsConfigSettings)
