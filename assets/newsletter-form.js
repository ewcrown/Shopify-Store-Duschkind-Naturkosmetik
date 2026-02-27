// This script handles the focus on success messages in the newsletter form to ensure accessibility.
document.addEventListener('DOMContentLoaded', function() {
  var success_messages = document.querySelectorAll('[data-newsletter-section-id]');
  success_messages.forEach(function(msg) {
    if (msg && msg.getAttribute('tabindex') === '-1') {
      setTimeout(function() {
        msg.focus();
      }, 100);
    }
  });
});