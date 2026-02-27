class LazyScriptLoader {
  constructor() {
    this.scripts = [];
    this.selector = "script[data-loading=\"lazy\"][data-src]";
    this.interactionEvents = ["mouseover","keydown","touchmove","touchstart","click"];
    this.loadAfterMsIfNoInteraction = 5000;
    this.loadTimer = null;
  }


  init() {
    // find all scripts
    this.scripts = document.querySelectorAll(this.selector);

    // if there are no scripts, return
    if (this.scripts.length === 0) return;

    // load scripts on user interaction
    this.interactionEvents.forEach((event) => {
      document.addEventListener(event, this.startLoadingScripts.bind(this), { passive: true });
    });

    // load scripts after a timeout if no user interaction
    this.loadTimer = setTimeout(this.startLoadingScripts.bind(this), this.loadAfterMsIfNoInteraction);
  }

  startLoadingScripts() {
    clearTimeout(this.loadTimer);

    this.loadScripts();
    this.interactionEvents.forEach((event) => {
      document.removeEventListener(event, this.startLoadingScripts.bind(this), { capture: true });
    })
  }

  loadScripts() {
    this.scripts.forEach((script) => {
      if (script.dataset.loading === "loaded") return;
      this.loadScript(script);
    });
  }

  loadScript(script) {
    script.dataset.loading = "loaded";
    script.src = script.dataset.src;
    script.removeAttribute("data-src");
    console.log('loaded script', script.src);
  }
}

const loader = new LazyScriptLoader();
window.onload = loader.init.bind(loader);