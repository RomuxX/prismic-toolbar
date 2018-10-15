import { getCookie, setCookie, deleteCookie, demolishCookie, isObject } from 'common';

const previewCookieName = 'io.prismic.preview'
const experimentCookieName = 'io.prismic.experiment'

fixCookiePath(previewCookieName)

// Preview cookie manager for a specific repository (safe to have multiple instances)
export class PreviewCookie {
  constructor(domain) {
    this.domain = domain;
  }

  // Getters & Setters (shortcuts) ---------------------
  
  get preview() {
    return PreviewCookie.getPreviewForDomainOrNull(this.domain)
  }

  set preview(value) {
    return PreviewCookie.setPreviewForDomain(this.domain, value)
  }

  static get url() {
    return PreviewCookie.getURLOrNull()
  }

  static set url(value) {
    return PreviewCookie.setUrl(value)
  }

  static get track() {
    return PreviewCookie.getTrackOrNull()
  }

  static set track(value) {
    return PreviewCookie.setTrack(value)
  }

  // Static methods ---------------------

  // Get preview for a domain or null
  static getPreviewForDomainOrNull(domain) {
    return PreviewCookie.getDomainOrObj(domain).preview || null
  }

  // Set a preview for a domain or remove with a falsy value
  static setPreviewForDomain(domain, value) {
    const obj = PreviewCookie.getDomainOrObj(domain)
    obj.preview = value
    PreviewCookie.setDomain(domain, obj)
  }

  // -> string | null
  static getUrlOrNull() {
    return PreviewCookie.getCompliantOrObj()._url || null
  }

  // _url: set with a truthyString or remove with a falsy value
  static setUrl(value) {
    const obj = PreviewCookie.getCompliantOrObj()
    obj._url = value
    PreviewCookie.setCompliant(obj)
  }

  // -> string | null
  static getTrackOrNull() {
    return PreviewCookie.getCompliantOrObj()._track || null
  }

  // _track: set with a truthyString or remove with a falsy value
  static setTrack(value) {
    const obj = PreviewCookie.getCompliantOrObj()
    obj._track = value
    PreviewCookie.setCompliant(obj)
  }

  // domain -> an object with the keys it found i.e. { preview, experiment, foo }
  static getDomainOrObj(domain) {
    PreviewCookie.getCompliantOrObj()[domain] || {}
  }

  // domain, value -> set with value of { preview: String } or remove domain
  // NOTE allow more keys here in the future
  static setDomain(domain, value) {
    let mergeableValue = null
    if (isObject(value) && value.preview) mergeableValue = { [domain]: { preview: value.preview } }
    const mergedValue = Object.assign(PreviewCookie.getCompliantOrObj(), mergeableValue)
    PreviewCookie.setCompliant(mergedValue)
  }

  // Fetch a compliant preview cookie or {}
  static getCompliantOrObj() {
    return PreviewCookie.createCompliant(getCookie(previewCookieName))
  }

  // Set a compliant preview cookie or delete it
  static setCompliant(obj) {
    return setCookie(previewCookieName, PreviewCookie.createCompliant(obj))
  }

  // Raw preview cookie (String or Object) -> Spec-compliant preview cookie
  // JSON { (0 or more) "ex.wroom.io": { "atLeastOneKey": "truthyString" }, (opt) "_url":  "...", (opt) "_track": "..." } | undefined
  static createCompliant(raw) {
    let compliant

    // Create JSON stucture
    try { // Raw value should be JS Object or JSON
      compliant = isObject(raw) ? raw : JSON.parse(raw)
    } catch(e) {
      try { // Or legacy
        compliant = {}
        compliant[new URL(raw).hostname] = raw
      }
      catch(e) { // Or give up
        return
      }
    }
    
    // Domain-specific validations
    Object.keys(compliant).filter(k => !/(_track|_url|_user)/.test(k)).map(repoKey => {
      const repoVal = compliant[repoKey]
      const delRepo = () => delete compliant[repoKey]
      
      // Remove domain if the key is invalid
      if (!/^[-a-zA-Z0-9]+\.[a-z]+\.[a-z]+$/.test(repoKey)) return delRepo()
      // Remove domain if the value is not an Object
      if (!isObject(repoVal)) return delRepo()
      // Remove non-truthy & non-string domain values
      Object.keys(repoVal).map(k => {
        if (!repoVal[k] || typeof repoVal[k] !== 'string') delete repoVal[k]
      })
      // Remove domain if no more values
      if (Object.values(repoVal).length === 0) return delRepo()
    })

    // If no keys, remove the cookie
    if (Object.keys(compliant).length === 0) return

    // Our compliant value
    return compliant
  }
}

// Experiment cookie manager (safe to have multiple instances)

export class ExperimentCookie {
  get() {
    return getCookie(experimentCookieName);
  }

  set(expId, variation) {
    const value = [expId, variation].join(' ');
    setCookie(experimentCookieName, value);
  }

  delete() {
    deleteCookie(experimentCookieName);
  }
}

// Helpers

// Makes sure the only cookie is one with a path of `/`
function fixCookiePath(name) {
  const value = getCookie(name);
  demolishCookie(name);
  setCookie(name, value);
}