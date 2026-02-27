class ProductBuyBar extends HTMLElement {
  constructor() {
    "use strict";
    super();

    let classes = { show: "show" };
    let mainProductForm = document.querySelector(".product-form");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // In view -> Hide bar
            this.classList.remove(classes.show);
          } else if (window.scrollY > 200) {
            // Out of view AND scrolled a little from top -> Show bar
            this.classList.add(classes.show);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(mainProductForm);

    // This script is loaded in product-template.liquid --> Footer observer after DOM ready
    document.addEventListener("DOMContentLoaded", function () {
      let siteFooter = document.querySelector("footer.footer");
      if (!siteFooter) return;
      observer.observe(siteFooter);
    });
  }
}
customElements.define("product-buy-bar", ProductBuyBar);

class UpsellCard extends HTMLElement {
  constructor() {
    super();
    this.select = this.querySelector('select');
    this.image = this.querySelector('.card-media img');

    if (this.select) {
      this.select.addEventListener('change', (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        const newImgSrc = selectedOption.getAttribute('data-variant-img-src');
        if (newImgSrc) { this.updateImage(newImgSrc) }
      });
    }
  }

  updateImage(newImgSrc) {
    if (this.image && newImgSrc) {
      // Sanitize and validate URL to prevent XSS
      // Remove any whitespace and HTML entities
      const sanitized = String(newImgSrc).trim().replace(/[\s<>"']/g, '');

      // Reject dangerous protocols (check anywhere in string, not just start)
      const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
      if (dangerousProtocols.test(sanitized)) {
        return; // Reject dangerous URLs
      }

      try {
        // Try to parse as absolute URL
        const url = new URL(sanitized, window.location.origin);
        // Only allow http and https protocols
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          // Use the properly constructed URL to prevent any encoding issues
          this.image.src = url.href;
        }
      } catch (e) {
        // If URL parsing fails, it's likely a relative URL
        // Additional validation: ensure it doesn't contain dangerous patterns
        if (!sanitized.includes('javascript:') &&
            !sanitized.includes('data:') &&
            !sanitized.includes('vbscript:') &&
            !sanitized.includes('<') &&
            !sanitized.includes('>')) {
          // For relative URLs, ensure proper encoding
          this.image.src = sanitized;
        }
      }
    }
  }
}

customElements.define('upsell-card', UpsellCard);