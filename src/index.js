import Toolbar from './toolbar';
import EditBtn from './editbtn';
import Experiments from './experiments';
import { debounce, removeHash } from './utils';
import Version from './version';
import Share from './share';


// window.prismic setup
let _startExperiment = _ => _;
const setupToolbar = debounce(_ => Toolbar.setup(), 500, true);
const setupEditButton = _ => config && EditBtn.setup(config);
const startExperiment = expId => { if (expId) _startExperiment = _ => Experiments.start(expId) };
const version = Version.value;
const endpoint = window.prismic && window.prismic.endpoint.replace(/\.cdn\.prismic\.io/, '.prismic.io');

window.prismic = { setup:setupToolbar, setupEditButton, startExperiment, version, endpoint };


// Config
const config = (_ => {

  if (!endpoint) return null;

  const urlComponents = endpoint.match(new RegExp('https?://([^/]*)'));

  if (!urlComponents[1]) return null;

  return {
    baseURL: urlComponents[0], // "http://foyer-demo.wroom.test"
    editorTab: urlComponents[1], // "foyer-demo.wroom.test"
    location: {
      origin: window.location.origin,
      hash: window.location.hash, // "http://localhost:3000"
      pathname: window.location.pathname, // "/fr-lu/page/foyer-voyage"
      search: window.location.search,
    }
  }

})();


// Initialization
async function init(session) {
  await Share.setup(config, session);
  startExperiment();
  setupToolbar();
  setupEditButton();
}


// Legacy session mechanism TODO
const hash = config.location.hash.match(/prismic-session=([-_a-zA-Z0-9]{16})/);
if (hash) {
  removeHash();
  setTimeout(_ => init(hash[1]), 0);
}


// New session mechanism
else {

  // Wait for /previews/session/get iFrame (will receive message even if no session)
  window.addEventListener('message', e => {
    if (config && e.data.type === 'preview') init(e.data.data);
  })

  // Session iFrame
  const iframe = document.createElement('iframe');
  iframe.src = `${config.baseURL}/previews/session/get`;
  iframe.style.display = 'none';
  document.head.appendChild(iframe);

}
