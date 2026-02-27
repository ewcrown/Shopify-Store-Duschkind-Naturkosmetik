class SizeGuideButton extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector('button');
    this.boundHandleClick = this.handleClick.bind(this);
  }

  connectedCallback() {
    if (this.button) {
      this.button.addEventListener('click', this.boundHandleClick);
    }
  }

  disconnectedCallback() {
    if (this.button) {
      this.button.removeEventListener('click', this.boundHandleClick);
    }
  }

  handleClick(event) {
    event.preventDefault();
    const drawerId = this.dataset.openDrawer;

    if (!drawerId) {
      if (Woolman?.Utils?.debugMode) {
        console.warn('SizeGuideButton: No data-open-drawer attribute specified');
      }
      return;
    }

    if (Woolman?.ModalsAndDrawers?.showModalOrDrawer) {
      Woolman.ModalsAndDrawers.showModalOrDrawer(drawerId);
    } else {
      if (Woolman?.Utils?.debugMode) {
        console.warn('SizeGuideButton: Woolman.ModalsAndDrawers.showModalOrDrawer is not available');
      }
    }
  }
}

if (customElements.get('size-guide-button') === undefined) {
  customElements.define('size-guide-button', SizeGuideButton);
}
