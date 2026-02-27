if (!customElements.get('share-button')) {
  customElements.define('share-button', class ShareButton extends HTMLElement {
    constructor() {
      super();

      this.elements = {
        shareButton: this.querySelector('button'),
        shareSummary: this.querySelector('summary'),
        successMessage: this.querySelector('[id^="ShareMessage"]'),
        urlInput: this.querySelector('input')
      }
      this.urlToShare = this.elements.urlInput ? this.elements.urlInput.value : document.location.href;
      this.mainDetailsToggle = this.querySelector('details')

      if (navigator.share) {;
        this.mainDetailsToggle.addEventListener('click', (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          navigator.share({
            url: this.urlToShare,
            title: document.title,
            text: this.getAttribute('data-text') || document.title
          })
        });
      } else {
        this.mainDetailsToggle.addEventListener('toggle', this.toggleDetails.bind(this));
        this.elements.shareButton.addEventListener('click', this.copyToClipboard.bind(this));
      }
    }

    toggleDetails() {
      if (!this.mainDetailsToggle.open) {
        this.elements.successMessage.classList.add('hidden');
        this.elements.successMessage.textContent = '';
        this.elements.shareSummary.focus();
      }
    }

    copyToClipboard() {
      navigator.clipboard.writeText(this.elements.urlInput.value).then(() => {
        this.elements.successMessage.classList.remove('hidden');
        this.elements.successMessage.textContent = window.accessibilityStrings.shareSuccess;
      });
    }

    updateUrl(url) {
      this.urlToShare = url;
      this.elements.urlInput.value = url;
    }
  });
}