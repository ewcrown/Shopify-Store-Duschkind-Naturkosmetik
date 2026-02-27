customElements.define('recently-viewed-products', class RecentlyViewedProducts extends HTMLElement {
  constructor() {
    super();

    this.template = document.getElementById('recently-viewed-products-template').content.firstElementChild.cloneNode(true);
    this.template.querySelector('.gridy-track').innerHTML = '';
    this.slider = this.template.querySelector('gridy-slider');
    this.sliderArrows = this.template.querySelector('.gridy-arrows');
    this.data_ipr_desktop = parseInt(this.slider.dataset.iprDesktop, 10) || 1;
    this.data_ipr_tablet = parseInt(this.slider.dataset.iprTablet, 10) || data_ipr_desktop;
    this.data_ipr_mobile = parseInt(this.slider.dataset.iprMobile, 10) || 1;

    this.limit = this.dataset.limit;
    this.currentTemplate = this.dataset.currentTemplate;
    this.showAsThumbnails = this.dataset.showAsThumbnails != undefined ? JSON.parse(this.dataset.showAsThumbnails) : false;

    // Section remains hidden if no history data found
    // History data is set from product-template.liquid
    this.history = sessionStorage.getItem('Woolman_Product_History') ? sessionStorage.getItem('Woolman_Product_History').split(',') : [];

    // On product template needs to have more than 1 item since the current product is also included in the list of items
    if (this.currentTemplate === 'template-product' && this.history.length <= 1 || this.history.length === 0) {
      return;
    }

    this.fetchProductHtml();
  }

  /* This function fetches item HTML snippets and passes them to initContainer function */
  async fetchProductHtml() {

    let currentIndex = 1;
    const promises = [];
    const rootUrl = window.routes.root == '/' ? '/' : window.routes.root + '/'; // if user has selected locale convert root url from /en-gb to /en-gb/
    if (this.currentTemplate === 'template-product') {
      this.history.shift();
    }

    const div = document.createElement("div");
    for (var i = 0; i < this.history.length; i++) {
      div.setAttribute('data-index', i);
      this.template.querySelector('.gridy-track').appendChild(div.cloneNode(true));
    }

    for (const productHandle of this.history) {
      let cardView = 'ajax-card';
      if (this.showAsThumbnails) {
        cardView = 'ajax-card-thumbnail';
      }
      promises.push(fetch(`${rootUrl}products/${productHandle}?view=${cardView}`));
      currentIndex++;
      if (currentIndex > this.limit) {
        break;
      }
    }

    const settledPromises = await Promise.allSettled(promises);
    const forEachPromises = settledPromises.map(async (promise, index) => {
      try {
        const res = await promise.value;
        if (res.status !== 200) {
          throw res.status;
        }
        const htmlString = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        const childToReplace = this.template.querySelector(`[data-index="${ index }"]`);
        const parent = childToReplace.parentNode;
        parent.replaceChild(doc.body.firstChild, childToReplace);
      } catch (err) {
        console.error(err);
        // You might want to handle errors within the forEach here
      }
    });

    // Use Promise.all to wait for all the forEachPromises to complete
    await Promise.all(forEachPromises).then(() => {
      if (this.data_ipr_mobile >= this.history.length) {
        this.sliderArrows.classList.add('sm-down-hide');
      }
      if (this.data_ipr_tablet >= this.history.length) {
        this.sliderArrows.classList.add('sm-to-md-hide');
      }
      if (this.data_ipr_desktop >= this.history.length) {
        this.sliderArrows.classList.add('md-hide');
      }
      this.appendChild(this.template);
      this.removeAttribute('hidden');
    });
  }
})