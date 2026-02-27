if (!customElements.get('modal-gridy-slider-parent')) {
  customElements.define('modal-gridy-slider-parent', class ModalGridySliderParent extends HTMLElement {
    constructor() {
      super();

      // begin by moving self to direct child of #MainContent
      const mainContent = document.querySelector('#MainContent');
      mainContent.appendChild(this);
    }
  })
}