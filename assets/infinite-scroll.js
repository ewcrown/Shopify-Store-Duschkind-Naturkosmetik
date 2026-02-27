// Redirect page to start one page one if infinite scroll in use.
(() => {
  const currentUrl = new URL(window.location.href);
  const searchParams = new URLSearchParams(currentUrl.search);

  if (searchParams.has('page') && parseInt(searchParams.get('page')) >= 2) {
    searchParams.delete('page');
    const newUrl = `${currentUrl.origin}${currentUrl.pathname}?${searchParams.toString()}`;
    window.location.href = newUrl;
  }
})();

// Infinite scroll for collection product grid and search results grid
// Can be triggered either by observer or button click
class InfiniteScroll extends HTMLElement {
  constructor() {
    super();

    this.button = this.querySelector('button');
    this.button.addEventListener('click', this.fetchNextPage.bind(this));
    this.nextUrl = this.dataset.nextUrl;
    this.isFetching = false; // Flag to track fetch status

    if (this.dataset.triggerType === 'infinite') {
      this.initObserver();
    }
  }

  initObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.fetchNextPage();
        }
      });
    }, { threshold: 0.5 });

    observer.observe(this);
  }

  async fetchNextPage() {
    if (this.isFetching) return; // Prevent fetch if already in progress

    this.isFetching = true; // Set flag to true
    this.button.classList.add('loading');
    this.querySelector('.loading-overlay').classList.remove('hidden');

    fetch(this.nextUrl)
      .then((response) => response.text())
      .then((responseText) => {
        const documentProductGrid = document.getElementById('product-grid-ajax'),
              documentPagination = document.getElementById('pagination-ajax'),
              html = new DOMParser().parseFromString(responseText, 'text/html'),
              fetchProductGrid = html.getElementById('product-grid-ajax'),
              fetchPagination = html.getElementById('pagination-ajax'),
              banners = fetchProductGrid.querySelectorAll('.card--banner');

        banners.forEach(function(banner) {
          fetchProductGrid.removeChild(banner);
        });

        documentProductGrid.insertAdjacentHTML('beforeend', fetchProductGrid.innerHTML);
        documentPagination.innerHTML = fetchPagination.innerHTML;

        // Save the whole collection div for back button usage
        const content = document.getElementById('collection-ajax').innerHTML;
        sessionStorage.setItem('pageContent', content);
        sessionStorage.setItem('pageContentURL', window.location.href);

      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this.isFetching = false; // Reset flag after fetch completes
        this.button.classList.remove('loading');
        this.querySelector('.loading-overlay').classList.add('hidden');
      });
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}
customElements.define('infinite-scroll', InfiniteScroll);

// Load content from local storage logic
(() => {
  // Back button detection
  if (performance.navigation.type !== 2) {
    return;
  }

  const contentURL = sessionStorage.getItem('pageContentURL');

  // URL of the content must mach wiht the page
  if (window.location.href !== contentURL) {
    return;
  }

  const content = sessionStorage.getItem('pageContent');
  if (content) {
      document.getElementById('collection-ajax').innerHTML = content;
  }
})();