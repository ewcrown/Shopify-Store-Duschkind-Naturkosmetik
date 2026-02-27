if (!customElements.get('count-down')) {
  customElements.define('count-down', class Countdown extends HTMLElement {
    constructor() {
      super();

      this.endDate = this.hasAttribute('end-date') ? new Date(this.getAttribute('end-date')).toUTCString() : Date.now().toUTCString();
      this.timeElement = this.querySelector('time');
      this.id_for = this.dataset.timerFor;
      this.init();
    }

    init () {
      const countdownTime = this.getCountdownTime(this.endDate);

      if (countdownTime.total > 0) {
        this.timeInterval = setInterval(() => {
          this.renderCountdown(this.getCountdownTime(this.endDate));
        }, 1000);
      } else {
        this.setAttribute('data-ended', 'true');
        document.dispatchEvent(new CustomEvent(`countdownEnded-${this.id_for}`));
      }
    }

    getCountdownTime(endDate) {
      const total = Date.parse(endDate) - Date.parse(new Date().toUTCString());
      const seconds = Math.floor((total / 1000) % 60);
      const minutes = Math.floor((total / 1000 / 60) % 60);
      const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
      const days = Math.floor(total / (1000 * 60 * 60 * 24));

      return {
        total,
        days,
        hours,
        minutes,
        seconds,
      };
    }

    renderCountdown(countdownTime) {
      const daysElement = this.querySelector('.days');
      const hoursElement = this.querySelector('.hours');
      const minutesElement = this.querySelector('.minutes');
      const secondsElement = this.querySelector('.seconds');

      daysElement.textContent = countdownTime.days;
      hoursElement.textContent = countdownTime.hours;
      minutesElement.textContent = countdownTime.minutes;
      secondsElement.textContent = countdownTime.seconds;

      this.timeElement.setAttribute('datetime', `P${countdownTime.days}DT${countdownTime.hours}H${countdownTime.minutes}M${countdownTime.seconds}S`);

      if (countdownTime.total <= 0) {
        clearInterval(this.timeInterval);
        this.setAttribute('data-ended', 'true');
        document.dispatchEvent(new CustomEvent(`countdownEnded-${this.id_for}`));
      }
    }
  });
}