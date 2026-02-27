Woolman.Utils.prepareQueryParams();
Woolman.Collection = document.querySelector('[data-ajax-parent]');

/**
 * Generates search params from form data for filtering collection or search results.
 * @param {HTMLElement} formElement - Form element to turn into search params.
 * @returns
 */
const generateSearchParamsFromFormData = (formElement) => {
  const checkboxesToKeep = {};
  for (const element of formElement.elements) {
    const key = element.getAttribute('name');
    if (!key || !key.includes('filter')) continue;

    const value = element.value;
    const inputType = element.getAttribute('type');

    if (value === '') continue;

    if (inputType == 'number' && (element.hasAttribute('data-min') || element.hasAttribute('data-max'))) {
      const priceSlider = element.closest('price-range-slider');
      if (!priceSlider || !priceSlider.hasAttribute('data-updated')) {
        continue; // Skip if slider hasn't been updated by user
      }
    }

    if (inputType == 'checkbox') {
      if (element.checked) {
        if (!checkboxesToKeep[key]) {
          checkboxesToKeep[key] = [value];
          continue;
        } else {
          checkboxesToKeep[key].push(value);
          continue;
        }
      }

      if (Shopify.queryParams[key] && !checkboxesToKeep[key]) {
        delete Shopify.queryParams[key];
      }
      continue;
    } else {
      Shopify.queryParams[key] = value;
    }
  }

  if (Object.entries(checkboxesToKeep).length > 0) {
    for (const [key, value] of Object.entries(checkboxesToKeep)) {
      Shopify.queryParams[key] = value.join(',');
    }
  }

  return Shopify.queryParams;
};

/**
 * Syncs checkbox states between all facets-form instances
 * Ensures sidebar and drawer forms stay in sync
 * @param {HTMLElement} changedCheckbox - The checkbox that was changed (optional)
 */
const syncCheckboxStates = (changedCheckbox = null) => {
  const allFacetsForms = document.querySelectorAll('facets-form');

  // If a specific checkbox changed, sync only that one
  if (changedCheckbox) {
    const name = changedCheckbox.getAttribute('name');
    const value = changedCheckbox.value;
    const checked = changedCheckbox.checked;

    if (name && name.includes('filter')) {
      allFacetsForms.forEach(form => {
        const correspondingInput = form.querySelector(`input[name="${name}"][value="${value}"]`);
        if (correspondingInput && correspondingInput !== changedCheckbox) {
          correspondingInput.checked = checked;
        }
      });
    }
    return;
  }

  // Otherwise, sync all checkboxes
  const allCheckboxes = document.querySelectorAll('facets-form input[type="checkbox"]');
  allCheckboxes.forEach(checkbox => {
    const name = checkbox.getAttribute('name');
    const value = checkbox.value;

    if (!name || !name.includes('filter')) return;

    // Find all corresponding checkboxes in other forms
    allFacetsForms.forEach(form => {
      const correspondingInput = form.querySelector(`input[name="${name}"][value="${value}"]`);
      if (correspondingInput && correspondingInput !== checkbox) {
        correspondingInput.checked = checkbox.checked;
      }
    });
  });
};



/**
 * This function fetches fresh collection page via AJAX request to collection's url.
 * @param {Array} selectors - Array of HTML element selectors to update.
 */
const getCollectionAJAX = async (selectors) => {
  Shopify.queryParams.page = 1;
  const CollectionURLSearchParams = getCollectionURLSearchParams(),
        url = location.pathname + '?' + CollectionURLSearchParams;

  if (selectors) {
    try {
      const res = await fetch(url);
      const body = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(body, 'text/html');

      for (const selector of selectors) {
        if (!document.querySelector(selector) || !doc.querySelector(selector)) continue;
        document.querySelector(selector).innerHTML = doc.querySelector(selector).innerHTML;

        // Update apply number
        if (selector === '#product-grid-ajax') {
          let filteredCount = parseInt(doc.querySelector(selector).dataset.filteredCount, 10),
              context = doc.querySelector(selector).dataset.context,
              zeroResultsMsg = document.getElementById('facets-no-results-message'),
              resultsStringOne = window.themeStrings.product_count_simple_one,
              resultsStringOther = window.themeStrings.product_count_simple_other;

          if (context === 'search') {
            resultsStringOne = window.themeStrings.results_with_count_one;
            resultsStringOther = window.themeStrings.results_with_count_other;
          }

          if (filteredCount === 0) {
            document.getElementById('apply-count').innerHTML = resultsStringOther.replace('[count]', filteredCount);
            zeroResultsMsg.classList.remove('hide');
          } else if (filteredCount === 1) {
            document.getElementById('apply-count').innerHTML = resultsStringOne.replace('[count]', filteredCount);
            zeroResultsMsg.classList.add('hide');
          } else {
            document.getElementById('apply-count').innerHTML = resultsStringOther.replace('[count]', filteredCount);
            zeroResultsMsg.classList.add('hide');
          }
        }
      }

      window.history.replaceState('', '', url);
      Woolman.Collection.classList.remove('processing');

    } catch (err) {
      location.search = CollectionURLSearchParams;
    }
  } else {
    location.search = CollectionURLSearchParams;
  }
};

/**
 * Returns URL for current collection. Utilizes URL parameters to save user's filters, sorting and pagination.
 * @returns
 */
const getCollectionURLSearchParams = () => {
  return new URLSearchParams(Object.entries(Shopify.queryParams)).toString().replaceAll(/%2C/g, ',');
};

class SortBySelect extends HTMLElement {
  constructor() {
    'use strict';
    super();

    this.select = this.querySelector('select');
    this.radios = this.querySelectorAll('input[type="radio"]');
    this.selectors = {
      grid: '#product-grid-ajax',
      pagination: '#pagination-ajax',
    };
    this.isSyncing = false; // Flag to prevent change events during sync

    if (Shopify.queryParams['sort_by']) {
      if (this.select) {
        this.select.value = Shopify.queryParams['sort_by'];
      } else if (this.radios.length > 0) {
        this.radios.forEach(radio => {
          if (radio.value === Shopify.queryParams['sort_by']) {
            radio.checked = true;
          }
        });
      }
    }

    if (this.select) {
      this.select.addEventListener('change', this.onSelectChange.bind(this));
    } else if (this.radios.length > 0) {
      this.radios.forEach(radio => {
        radio.addEventListener('change', this.onSelectChange.bind(this));
      });
    }
  }

  connectedCallback() {
    // Initial sync is handled by the constructor setting values from query params
  }

  /**
   * Syncs the value of this sort-by element to all other sort-by instances
   * @param {string} value - The value to sync to all instances
   */
  syncToAllInstances(value) {
    if (this.isSyncing) return; // Prevent infinite loops

    this.isSyncing = true;
    const allSortByElements = document.querySelectorAll('sort-by');

    allSortByElements.forEach((sortByElement) => {
      if (sortByElement === this) return; // Skip self

      sortByElement.isSyncing = true; // Set flag on target element

      // Handle select elements
      if (sortByElement.select) {
        if (sortByElement.select.value !== value) {
          sortByElement.select.value = value;
        }
      }
      // Handle radio buttons
      else if (sortByElement.radios.length > 0) {
        sortByElement.radios.forEach(radio => {
          radio.checked = (radio.value === value);
        });
      }

      sortByElement.isSyncing = false; // Clear flag on target element
    });

    this.isSyncing = false;
  }

  async onSelectChange(event) {
    // Don't trigger AJAX if this change was caused by syncing
    if (this.isSyncing) {
      return;
    }

    const value = event.target.value;

    // Sync to all other sort-by instances (without triggering their change events)
    this.syncToAllInstances(value);

    // Now trigger the AJAX update
    Woolman.Collection.classList.add('processing');
    Woolman.Utils.prepareQueryParams();
    Shopify.queryParams.sort_by = value;
    getCollectionAJAX(Object.values(this.selectors));
  }
}

if (customElements.get('sort-by') === undefined) {
  customElements.define('sort-by', SortBySelect);
}

class FacetsForm extends HTMLElement {
  constructor() {
    'use strict';
    super();

    this.el = this.querySelector('form');
    this.selectors = {
      grid: '#product-grid-ajax',
      count: '#products-count-ajax',
      currentFacets: '#current-facets-ajax',
      pagination: '#pagination-ajax',
    };

    this.el.addEventListener('submit', this.onFormSubmit.bind(this));
  }

  connectedCallback() {
    // Set up input change listeners and sync functionality
    const inputs = this.el.querySelectorAll('input');

    inputs.forEach((input) => {
      // Create debounced AJAX handler for this input
      const debouncedAJAX = debounce(this.onInputChange.bind(this), 150);

      input.addEventListener('change', (event) => {
        if (input.type === 'checkbox') {
          // Sync immediately on change, before AJAX
          syncCheckboxStates(input);
        }
        // Then trigger debounced AJAX update
        debouncedAJAX(event);
      });
    });
  }

  async onFormSubmit(event) {
    event.preventDefault();
    Woolman.Collection.classList.add('processing');
    Woolman.Utils.prepareQueryParams();
    generateSearchParamsFromFormData(this.el);

    Woolman.ModalsAndDrawers.closeModalOrDrawer(this.closest('[data-drawer]').getAttribute('id'));
    getCollectionAJAX(Object.values(this.selectors));
  }

  async onInputChange(event) {
    Woolman.Collection.classList.add('processing');
    generateSearchParamsFromFormData(this.el);
    getCollectionAJAX(Object.values(this.selectors));
  }
}

// Sync checkboxes when drawer opens
const drawerFilter = document.getElementById('drawer-filter');
if (drawerFilter) {
  const observer = new MutationObserver((mutations) => {
    if (drawerFilter.classList.contains('is-open')) {
      // Ensure query params are up to date
      Woolman.Utils.prepareQueryParams();

      // Sync all checkboxes from URL params
      const drawerForm = drawerFilter.querySelector('facets-form form');
      if (drawerForm) {
        const drawerCheckboxes = drawerForm.querySelectorAll('input[type="checkbox"]');
        drawerCheckboxes.forEach(checkbox => {
          const paramName = checkbox.getAttribute('name');
          const value = checkbox.value;

          if (paramName && paramName.includes('filter') && Shopify.queryParams[paramName]) {
            const paramValues = Shopify.queryParams[paramName].split(',');
            checkbox.checked = paramValues.includes(value);
          }
        });
      }

      // Sync all forms to ensure consistency
      syncCheckboxStates();
    }
  });

  observer.observe(drawerFilter, {
    attributes: true,
    attributeFilter: ['class']
  });
}

if (customElements.get('facets-form') === undefined) {
  customElements.define('facets-form', FacetsForm);
}

class CurrentFacetButton extends HTMLElement {
  constructor() {
    'use strict';
    super();

    this.selectors = {
      grid: '#product-grid-ajax',
      count: '#products-count-ajax',
      currentFacets: '#current-facets-ajax',
      pagination: '#pagination-ajax',
    };

    this.btn = this.querySelector('a');
    this.btn.addEventListener('click', this.removeFacet.bind(this));
  }

  async removeFacet(event) {
    event.preventDefault();
    if (event.currentTarget.dataset.filterParamName === 'filter.v.price') {
      // Delete price filter params
      delete Shopify.queryParams['filter.v.price.lte'];
      delete Shopify.queryParams['filter.v.price.gte'];

      // Reset all price range sliders (sidebar and drawer)
      if (typeof PriceRangeSlider !== 'undefined' && PriceRangeSlider.resetAll) {
        PriceRangeSlider.resetAll();
      }

      // Remove data-updated attribute from all sliders
      const allSliders = document.querySelectorAll('price-range-slider');
      allSliders.forEach(slider => {
        slider.removeAttribute('data-updated');
      });

      getCollectionAJAX(Object.values(this.selectors));
    } else {
      const inputToReset = document.querySelector(`.filter-form [data-key-value="${ event.currentTarget.dataset.filterParamName }:${ event.currentTarget.dataset.filterValue }"]`);
      inputToReset.checked = false;
      inputToReset.dispatchEvent(new Event('change'));
    }
  }
}
if (customElements.get('current-facet-button') === undefined) {
  customElements.define('current-facet-button', CurrentFacetButton);
}