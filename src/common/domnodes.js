export const div = (id, options) => node({ type: 'div', id, ...options });
export const script = src => srcNode({ type: 'script', src });

export const shadow = id => {
  let node = div(id);
  if (Boolean(document.head.attachShadow)) node = node.attachShadow({ mode: 'open' });
  return node;
};

export const deleteNodes = cssQuery => {
  document.querySelectorAll(cssQuery).forEach(el => el.remove());
};

// Append Stylesheet to DOM node
export const appendCSS = (node, css) => {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));
  node.appendChild(style);
};

// Load something
function node({ id, type, body = true, ...options }) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement(type);
    document[body ? 'body' : 'head'].appendChild(el);
  }
  Object.assign(el, options, { id });
  return el;
}

// Load something with src
async function srcNode({ src, type, body = false, ...options }) {
  return new Promise(resolve => {
    const el = node({ ...options, id: src, type, body });
    el.addEventListener('load', () => resolve(el));
  });
}
