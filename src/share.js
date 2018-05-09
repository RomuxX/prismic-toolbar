import Preview from './preview';
import Config from './config';
import { iFrame, readyDOM } from './utils';

// Get preview ref from iframe
const REF_IFRAME = iFrame(`${Config.baseURL}/previews/messenger`);
const REF_PROMISE = new Promise(resolve => {
  window.addEventListener('message', msg => {
    if (msg.data.type !== 'previewRef') return;
    resolve(msg.data.data);
  });
});


function logError(message) {
  console.error(`[prismic.io] Unable to access to preview session: ${message}`); // eslint-disable-line
}

const PRISMIC_SESSION_REG = /#(([^~]+)~)?prismic-session=([-_a-zA-Z0-9]{16})/;

function displayLoading() {
  return new Promise(resolve => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', `${Config.baseURL}/previews/loading`);
    iframe.style.position = 'fixed';
    iframe.style.right = 0;
    iframe.style.left = 0;
    iframe.style.top = 0;
    iframe.style.bottom = 0;
    iframe.style['z-index'] = 2147483000;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.opacity = 0;
    iframe.style.transition = '.5s opacity';
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      iframe.style.opacity = 1;
      window.setTimeout(() => resolve(), 1800);
    }, 200);
  });
}

async function listen() {
  const isLegacy = !(await fetch(`${Config.baseURL}/previews/messenger`)).ok

  await readyDOM();

  if (isLegacy) return legacySetup(); // TODO handle non-shareable preview setup

  const ref = (await REF_PROMISE) || null;
  const cookie = Preview.get() || null;

  // need to delete cookie
  if (!ref && cookie) {
    await sessionClose();
    Preview.close();
    window.location.reload();
  }

  // need to set cookie (missed change or another session)
  if (ref && ref !== cookie) {
    await displayLoading();
    Preview.set(ref);
    window.location.reload();
  }
}

// TODO LEGACY
function legacySetup() {
  return new Promise(resolve => {
    const { hash } = Config.location;
    const matches = hash.match(PRISMIC_SESSION_REG);
    const sessionId = matches && matches[3];

    if (sessionId) {
      displayLoading(() => {
        const endpoint = `${Config.baseURL}/previews/token/${sessionId}`;
        fetch(endpoint).then(response => {
          response.json().then(json => {
            if (json.ref) {
              Preview.close();
              Preview.set(json.ref);
              const updatedHash = hash.replace(PRISMIC_SESSION_REG, '$2');
              const href = `${Config.location.origin}${Config.location.pathname}${Config.location.search}${updatedHash ? `#${updatedHash}` : ''}`;
              window.location.href = href;
              if (updatedHash) {
                window.location.reload();
              }
            } else {
              logError("Session id isn't valid");
              resolve();
            }
          }).catch(() => {
            logError('Invalid server response');
            resolve();
          });
        }).catch(() => {
          logError('Invalid server response');
          resolve();
        });
      });
    } else resolve();
  });
}

async function sessionClose() {
  (await REF_IFRAME).contentWindow.postMessage({ type: 'close' }, '*');
}

export default {
  listen,
  close,
};
