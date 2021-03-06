class Messenger {
  constructor(src) {
    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.src = src;
    this.iframe.style.cssText = "display: none !important; width: 1px !important; height: 1px !important; opacity: 0 !important; pointer-events: none !important;";
    document.body.appendChild(this.iframe);

    // Listen for ready
    this.ready = new Promise(resolve => {
      this.iframe.addEventListener('ready', resolve, { once: true });
    });

    // Dispatch messages to iframe
    window.addEventListener('message', msg => {
      if (this.iframe.contentWindow !== msg.source) return;
      const { type, data } = msg.data;
      const event = new Event(type);
      event.detail = data;
      this.iframe.dispatchEvent(event);
    });
  }

  async post(type, data) {
    await this.ready;
    return new Promise(resolve => {
      this.iframe.addEventListener(type, e => resolve(e.detail), { once: true });
      this.iframe.contentWindow.postMessage({ type, data }, '*');
    });
  }
}

export default Messenger;
