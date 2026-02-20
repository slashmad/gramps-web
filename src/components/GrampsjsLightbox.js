import {html, css, LitElement} from 'lit'

import {sharedStyles} from '../SharedStyles.js'
import {chevronLeftIcon, chevronRightIcon, closeIcon} from '../icons.js'

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value))

class GrampsjsLightbox extends LitElement {
  static get styles() {
    return [
      sharedStyles,
      css`
        #lightbox-container {
          background-color: var(--grampsjs-lightbox-background-color);
          position: fixed;
          left: 0;
          top: 0;
          right: 0;
          min-height: 100vh;
          width: 100vw;
          z-index: 10000;
          overflow: auto;
        }

        #lightbox {
          width: 100%;
          position: fixed;
          overflow: hidden;
          top: 0;
          left: 0;
          bottom: 70px;
          color: var(--grampsjs-lightbox-font-color);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        #text {
          position: absolute;
          box-sizing: border-box;
          width: 100%;
          top: calc(100vh - 70px);
          left: 0;
          background-color: var(--md-sys-color-surface);
          color: var(--md-sys-color-on-surface);
          z-index: 10002;
          min-height: 70px;
          overflow-x: hidden;
          margin: 0;
        }

        #description-container {
          font-family: var(--grampsjs-heading-font-family);
          height: 70px;
          font-size: 22px;
          line-height: 30px;
          font-weight: 400;
          overflow: hidden;
          padding: 20px;
          text-overflow: ellipsis;
        }

        #button-container {
          float: right;
          height: 70px;
          width: 350px;
          font-size: 22px;
          line-height: 30px;
          font-weight: 400;
          overflow: hidden;
          padding: 20px;
          text-overflow: ellipsis;
          text-align: right;
        }

        #detail-container {
          clear: right;
        }

        .lightbox-nav {
          z-index: 10001;
        }

        .lightbox-nav svg {
          height: 2em;
          width: 2em;
        }

        .lightbox-nav:hover svg path {
          fill: var(--grampsjs-lightbox-nav-hover-color);
        }

        .lightbox-nav svg path {
          fill: var(--grampsjs-lightbox-nav-color);
        }

        #close-lightbox {
          position: fixed;
          right: 1.5em;
          top: 1.5em;
        }

        .arrow {
          position: fixed;
          top: calc(50vh - 45px);
        }

        .arrow-left {
          left: 5vw;
        }

        .arrow-right {
          right: 5vw;
        }

        #media-container {
          position: absolute;
          width: 100%;
          height: 100%;
          text-align: center;
        }

        #zoom-viewport {
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #zoom-content {
          transform-origin: center center;
          will-change: transform;
          transition: transform 60ms linear;
        }

        #zoom-content.zoomable {
          cursor: grab;
        }

        #zoom-content.panning {
          cursor: grabbing;
          transition: none;
        }
      `,
    ]
  }

  static get properties() {
    return {
      open: {type: Boolean},
      _translateX: {type: Number},
      hideLeftArrow: {type: Boolean},
      hideRightArrow: {type: Boolean},
      disableTouch: {type: Boolean},
      zoomable: {type: Boolean},
      zoomKey: {type: String},
      _scale: {type: Number},
      _panX: {type: Number},
      _panY: {type: Number},
      _panning: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.open = false
    this._translateX = 0
    this.hideLeftArrow = false
    this.hideRightArrow = false
    this.disableTouch = false
    this.zoomable = false
    this.zoomKey = ''
    this._scale = 1
    this._panX = 0
    this._panY = 0
    this._panning = false
    this._pointerId = null
    this._zoomMin = 1
    this._zoomMax = 8
  }

  render() {
    if (!this.open) {
      return html``
    }
    return html`
      <div id="lightbox-container" @keydown="${this._handleKeyPress}">
        <div class="lightbox-nav" id="close-lightbox" tabindex="0">
          <span @click="${this._close}" class="link" @keydown=""
            >${closeIcon}</span
          >
        </div>
        ${!this.hideLeftArrow
          ? html`
              <div class="lightbox-nav arrow arrow-left">
                <span @click="${this._handleLeft}" class="link" @keydown=""
                  >${chevronLeftIcon}</span
                >
              </div>
            `
          : ''}
        ${!this.hideRightArrow
          ? html`
              <div class="lightbox-nav arrow arrow-right">
                <span @click="${this._handleRight}" class="link" @keydown=""
                  >${chevronRightIcon}</span
                >
              </div>
            `
          : ''}
        <div
          id="lightbox"
          tabindex="0"
          style="transform: translateX(${this._translateX}px);"
          @touchstart="${this._handleTouchStart}"
          @touchmove="${this._handleTouchMove}"
          @touchend="${this._handleTouchEnd}"
          @wheel="${this._handleWheel}"
          @pointerdown="${this._handlePointerDown}"
          @pointermove="${this._handlePointerMove}"
          @pointerup="${this._handlePointerUp}"
          @pointercancel="${this._handlePointerUp}"
        >
          <div id="zoom-viewport">
            <div
              id="zoom-content"
              class="${this.zoomable ? 'zoomable' : ''} ${
                this._panning ? 'panning' : ''
              }"
              style="transform: translate3d(${this._panX}px, ${
                this._panY
              }px, 0) scale(${this._scale});"
            >
              <slot
                name="image"
                @rect:draw-start="${this._handleRectStart}"
                @rect:draw-end="${this._handleRectEnd}"
              ></slot>
            </div>
          </div>
        </div>
        <div id="text" tabindex="0">
          <div id="button-container">
            <slot name="button"></slot>
          </div>
          <div id="description-container">
            <slot name="description"></slot>
          </div>
          <div id="detail-container">
            <slot name="details"></slot>
          </div>
        </div>
      </div>
    `
  }

  _close() {
    this.open = false
  }

  _handleLeft() {
    this.dispatchEvent(
      new CustomEvent('lightbox:left', {
        bubbles: true,
        composed: true,
        detail: {id: this.id},
      })
    )
  }

  _handleRight() {
    this.dispatchEvent(
      new CustomEvent('lightbox:right', {
        bubbles: true,
        composed: true,
        detail: {id: this.id},
      })
    )
  }

  _handleKeyPress(event) {
    if (event.code === 'Escape') {
      this._close()
    } else if (event.key === 'ArrowRight' || event.key === 'Right') {
      this._handleRight()
    } else if (event.key === 'ArrowLeft' || event.key === 'Left') {
      this._handleLeft()
    }
  }

  _handleRectStart(e) {
    this.disableTouch = true
    e.preventDefault()
    e.stopPropagation()
  }

  _handleRectEnd(e) {
    this.disableTouch = false
    e.preventDefault()
    e.stopPropagation()
  }

  _handleTouchStart(e) {
    if (!this.disableTouch && this._scale <= 1) {
      this._touchStartX = e.touches[0].pageX
      this._touchMoveX = this._touchStartX
    }
  }

  _handleTouchMove(e) {
    if (!this.disableTouch && this._scale <= 1) {
      this._touchMoveX = e.touches[0].pageX
      this._translateX = this._touchMoveX - this._touchStartX
    }
  }

  _handleTouchEnd() {
    if (!this.disableTouch && this._scale <= 1) {
      this._translateX = 0
      const movedX = this._touchMoveX - this._touchStartX
      if (movedX < -10) {
        this._handleRight()
      } else if (movedX > 10) {
        this._handleLeft()
      }
    }
  }

  _handleWheel(event) {
    if (!this.zoomable || this.disableTouch) {
      return
    }
    event.preventDefault()

    const prevScale = this._scale
    const zoomFactor = Math.exp(-event.deltaY * 0.0015)
    const nextScale = clampValue(
      prevScale * zoomFactor,
      this._zoomMin,
      this._zoomMax
    )
    if (Math.abs(nextScale - prevScale) < 0.001) {
      return
    }

    const viewport = this.shadowRoot.getElementById('lightbox')
    if (!viewport) {
      return
    }
    const rect = viewport.getBoundingClientRect()
    const pointerX = event.clientX - rect.left - rect.width / 2
    const pointerY = event.clientY - rect.top - rect.height / 2
    const scaleRatio = nextScale / prevScale

    this._panX = pointerX - scaleRatio * (pointerX - this._panX)
    this._panY = pointerY - scaleRatio * (pointerY - this._panY)
    this._scale = nextScale
    this._clampPan()
  }

  _handlePointerDown(event) {
    if (
      !this.zoomable ||
      this.disableTouch ||
      this._scale <= 1 ||
      event.pointerType === 'touch' ||
      event.button !== 0
    ) {
      return
    }
    this._panning = true
    this._pointerId = event.pointerId
    this._panStartX = event.clientX
    this._panStartY = event.clientY
    this._panOriginX = this._panX
    this._panOriginY = this._panY
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  _handlePointerMove(event) {
    if (!this._panning || this._pointerId !== event.pointerId) {
      return
    }
    this._panX = this._panOriginX + (event.clientX - this._panStartX)
    this._panY = this._panOriginY + (event.clientY - this._panStartY)
    this._clampPan()
    event.preventDefault()
  }

  _handlePointerUp(event) {
    if (this._pointerId !== event.pointerId) {
      return
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    this._panning = false
    this._pointerId = null
  }

  _clampPan() {
    if (this._scale <= 1) {
      this._panX = 0
      this._panY = 0
      return
    }

    const viewport = this.shadowRoot?.getElementById('lightbox')
    const content = this.shadowRoot?.getElementById('zoom-content')
    if (!viewport || !content) {
      return
    }

    const viewportWidth = viewport.clientWidth || 0
    const viewportHeight = viewport.clientHeight || 0
    const contentWidth = content.offsetWidth || 0
    const contentHeight = content.offsetHeight || 0
    if (viewportWidth <= 0 || viewportHeight <= 0 || contentWidth <= 0 || contentHeight <= 0) {
      return
    }

    const maxPanX = Math.max((contentWidth * this._scale - viewportWidth) / 2, 0)
    const maxPanY = Math.max((contentHeight * this._scale - viewportHeight) / 2, 0)
    this._panX = clampValue(this._panX, -maxPanX, maxPanX)
    this._panY = clampValue(this._panY, -maxPanY, maxPanY)
  }

  _resetZoom() {
    this._scale = 1
    this._panX = 0
    this._panY = 0
    this._panning = false
    this._pointerId = null
  }

  _focus() {
    if (this.open) {
      const lightBox = this.shadowRoot.getElementById('lightbox')
      lightBox.focus()
    }
  }

  updated(changed) {
    if (
      (changed.has('open') && this.open) ||
      (changed.has('zoomKey') && this.open)
    ) {
      this._resetZoom()
    }
    if (changed.has('_scale') || changed.has('zoomable')) {
      this._clampPan()
    }
    this._focus()
  }
}

window.customElements.define('grampsjs-lightbox', GrampsjsLightbox)
