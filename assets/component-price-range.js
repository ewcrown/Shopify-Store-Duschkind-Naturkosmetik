class PriceRangeSlider extends HTMLElement {
    constructor() {
      super();

      // Default configuration values from attributes
      this.min = parseFloat(this.getAttribute('data-min')) || 0;
      this.max = parseFloat(this.getAttribute('data-max')) || 100;
      this.currentMin = parseFloat(this.getAttribute('data-min-value')) || this.min;
      this.currentMax = parseFloat(this.getAttribute('data-max-value')) || this.max;
      this.dragging = null;

      // Add this instance to the static collection
      if (!PriceRangeSlider.instances) {
        PriceRangeSlider.instances = [];
      }
      PriceRangeSlider.instances.push(this);
    }

    connectedCallback() {
      // Get elements from the light DOM
      this.sliderContainer = this.querySelector('.slider-container');
      this.thumbMin = this.querySelector('[data-thumb-min]');
      this.thumbMax = this.querySelector('[data-thumb-max]');
      this.range = this.querySelector('.range');
      this.inputMin = this.querySelector('[data-min]');
      this.inputMax = this.querySelector('[data-max]');

      // Check if price filter exists in URL params (user has already applied filter)
      if (typeof Shopify !== 'undefined' && Shopify.queryParams) {
        if (Shopify.queryParams['filter.v.price.gte'] || Shopify.queryParams['filter.v.price.lte']) {
          this.setAttribute('data-updated', 'true');
        }
      }
      // Set initial positions, inputs, and ARIA attributes
      this.updatePositions();
      this.updateInputs('both', true); // Silent update on initialization to avoid triggering AJAX

      // Pointer events for dragging
      this.thumbMin.addEventListener('pointerdown', (e) => this.onPointerDown(e, 'min'));
      this.thumbMax.addEventListener('pointerdown', (e) => this.onPointerDown(e, 'max'));
      window.addEventListener('pointermove', (e) => this.onPointerMove(e));
      window.addEventListener('pointerup', (e) => this.onPointerUp(e));

      // Keyboard events for accessibility
      this.thumbMin.addEventListener('keydown', (e) => this.onKeyDown(e, 'min'));
      this.thumbMax.addEventListener('keydown', (e) => this.onKeyDown(e, 'max'));

      // Input events to update slider when values change
      this.inputMin.addEventListener('input', (e) => this.onInputMin(e));
      this.inputMax.addEventListener('input', (e) => this.onInputMax(e));
    }

    disconnectedCallback() {
      // Remove this instance from the static collection
      PriceRangeSlider.instances = PriceRangeSlider.instances.filter(inst => inst !== this);
    }

    onPointerDown(e, which) {
      e.preventDefault();
      // Optionally capture the pointer for better tracking if available
      if (typeof e.target.setPointerCapture === 'function') {
        e.target.setPointerCapture(e.pointerId);
      }
      this.dragging = which;
    }

    onPointerMove(e) {
      if (!this.dragging) return;
      const rect = this.sliderContainer.getBoundingClientRect();
      let percent = (e.clientX - rect.left) / rect.width;
      percent = Math.min(Math.max(percent, 0), 1);
      const value = this.min + percent * (this.max - this.min);

      if (this.dragging === 'min') {
        this.currentMin = Math.min(value, this.currentMax);
      } else if (this.dragging === 'max') {
        this.currentMax = Math.max(value, this.currentMin);
      }
      this.updatePositions();
      this.updateInputs(this.dragging); // dispatch event only for the dragged thumb's input
      this.syncOtherSliders();
      // Mark as updated when user drags the slider (only set once to avoid redundant DOM writes)
      if (!this.hasAttribute('data-updated')) {
        this.setAttribute('data-updated', 'true');
      }
    }

    onPointerUp(e) {
      // Mark as updated when user finishes dragging (if dragging was active)
      if (this.dragging !== null) {
        this.setAttribute('data-updated', 'true');
      }
      this.dragging = null;
      if (typeof e.target.releasePointerCapture === 'function') {
        e.target.releasePointerCapture(e.pointerId);
      }
    }

    onKeyDown(e, which) {
      const step = 1;
      switch (e.key) {
        case 'ArrowRight':
        case 'Right':
          if (which === 'min') {
            this.currentMin = Math.min(this.currentMin + step, this.currentMax);
          } else {
            this.currentMax = Math.min(this.currentMax + step, this.max);
          }
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'Left':
          if (which === 'min') {
            this.currentMin = Math.max(this.currentMin - step, this.min);
          } else {
            this.currentMax = Math.max(this.currentMax - step, this.currentMin);
          }
          e.preventDefault();
          break;
        case 'Home':
          if (which === 'min') {
            this.currentMin = this.min;
          } else {
            this.currentMax = this.currentMin;
          }
          e.preventDefault();
          break;
        case 'End':
          if (which === 'min') {
            this.currentMin = this.currentMax;
          } else {
            this.currentMax = this.max;
          }
          e.preventDefault();
          break;
      }
      this.updatePositions();
      this.updateInputs(which);
      this.syncOtherSliders();
      // Mark as updated when user interacts via keyboard
      this.setAttribute('data-updated', 'true');
    }

    onInputMin(e) {
      let val = parseFloat(e.target.value);
      if (isNaN(val)) return;
      val = Math.min(Math.max(val, this.min), this.currentMax);
      this.currentMin = val;
      this.updatePositions();
      this.updateInputs('min');
      this.syncOtherSliders();
      // Mark as updated when user manually changes min input
      this.setAttribute('data-updated', 'true');
    }

    onInputMax(e) {
      let val = parseFloat(e.target.value);
      if (isNaN(val)) return;
      val = Math.max(Math.min(val, this.max), this.currentMin);
      this.currentMax = val;
      this.updatePositions();
      this.updateInputs('max');
      this.syncOtherSliders();
      // Mark as updated when user manually changes max input
      this.setAttribute('data-updated', 'true');
    }

    updatePositions() {
      // Calculate percentage positions for each thumb
      const percentMin = ((this.currentMin - this.min) / (this.max - this.min)) * 100;
      const percentMax = ((this.currentMax - this.min) / (this.max - this.min)) * 100;

      // Update thumb positions with adjustment for thumb width
      this.thumbMin.style.left = `calc(${percentMin}% - var(--thumb-width) / 2)`;
      this.thumbMax.style.left = `calc(${percentMax}% - var(--thumb-width) / 2)`;

      // Update the colored range bar between the thumbs
      this.range.style.left = `${percentMin}%`;
      this.range.style.width = `${percentMax - percentMin}%`;

      // Update ARIA attributes for accessibility
      this.thumbMin.setAttribute('aria-valuemin', this.min);
      this.thumbMin.setAttribute('aria-valuemax', this.currentMax);
      this.thumbMin.setAttribute('aria-valuenow', Math.round(this.currentMin));
      this.thumbMin.setAttribute('aria-label', 'Minimum Price');

      this.thumbMax.setAttribute('aria-valuemin', this.currentMin);
      this.thumbMax.setAttribute('aria-valuemax', this.max);
      this.thumbMax.setAttribute('aria-valuenow', Math.round(this.currentMax));
      this.thumbMax.setAttribute('aria-label', 'Maximum Price');
    }

    updateInputs(changedInput = 'both', silent = false) {
      // Synchronize the number inputs with current slider values
      this.inputMin.value = Math.round(this.currentMin);
      this.inputMax.value = Math.round(this.currentMax);

      // Dispatch change event only if not silent
      if (!silent) {
        if (changedInput === 'min') {
          this.inputMin.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (changedInput === 'max') {
          this.inputMax.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          this.inputMin.dispatchEvent(new Event('change', { bubbles: true }));
          this.inputMax.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    // Sync this slider's values to all other instances silently
    syncOtherSliders() {
      if (PriceRangeSlider.instances && PriceRangeSlider.instances.length > 1) {
        PriceRangeSlider.instances.forEach(instance => {
          if (instance !== this) {
            instance.currentMin = this.currentMin;
            instance.currentMax = this.currentMax;
            instance.updatePositions();
            instance.updateInputs('both', true); // silent update
          }
        });
      }
    }

    // Instance method to reset this slider to its original min and max values.
    reset() {
      this.currentMin = this.min;
      this.currentMax = this.max;
      this.updatePositions();
      this.updateInputs('both', true);
      this.syncOtherSliders();
    }

    // Static method to reset all sliders at once.
    static resetAll() {
      if (PriceRangeSlider.instances) {
        PriceRangeSlider.instances.forEach(instance => {
          instance.currentMin = instance.min;
          instance.currentMax = instance.max;
          instance.updatePositions();
          instance.updateInputs('both', true);
        });
      }
    }
  }

  // Define the custom element if not already defined
  if (customElements.get("price-range-slider") === undefined) {
    customElements.define('price-range-slider', PriceRangeSlider);
  }