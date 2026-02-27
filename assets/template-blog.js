class LinkDropdown extends HTMLElement {
  constructor() {
    super();

    this.select = this.querySelector('#filter-by');
    this.blogUrl = this.select.dataset.blogUrl;

    this.select.addEventListener('change', this.onSelectChange.bind(this));
  }

  onSelectChange() {
    if (this.select.value.length > 0) {
      window.location.href = this.blogUrl + '/tagged/' + encodeURIComponent(this.select.value);
    }
    else window.location.href = this.blogUrl;
  }
}

customElements.define("link-dropdown", LinkDropdown);
