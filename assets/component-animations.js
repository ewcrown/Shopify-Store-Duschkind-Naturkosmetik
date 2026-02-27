
// Function that adds 'in-viewport' class to any .shopify-section when it enters the viewport
// Uses IntersectionObserver API for the detection
// https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
(function addInViewportClass(elements) {
  const threshold = Shopify || Shopify.designMode === true ? 0 : 0.15;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('section-anim-in');
        entry.target.classList.add('section-in-view');
        entry.target.dispatchEvent(new CustomEvent('section:in-viewport'))
      } else {
        entry.target.classList.remove('section-in-view');
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: [threshold, 1],
  });

  elements.forEach((el) => {
    observer.observe(el);
  });
})(document.querySelectorAll('.shopify-section'))