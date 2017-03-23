const i18next = require('i18next');
const assert = require('assert');

const defaultOptions = {
  getI18nextOptions: () => ({}),
  getVersion: () => Promise.resolve(),
  getNamespaces: () => Promise.resolve([]),
  compareVersion: (oldVersion, newVersion) => oldVersion === newVersion,
  log: (level, meta, msg) => {},
  isFatalError: err => true,
  interval: 1000 * 60 * 10 // check i18n version every 10 minutes
};

class I18nextManager {
  constructor(options) {
    this.options = Object.assign({}, defaultOptions, options);
    this.getVersion = this.options.getVersion;
    this.getNamespaces = this.options.getNamespaces;
    this.compareVersion = this.options.compareVersion;
    this.getI18nextOptions = this.options.getI18nextOptions;
    this.isFatalError = this.options.isFatalError;
    this.plugins = [];
    this.log = this.options.log;
    this.version = null;
    this.namespaces = [];
    this.i18next = null;
    this.startInterval();
  }

  destroy() {
    this.stopInterval();
    return this;
  }

  startInterval() {
    if (this.options.interval) {
      this.timer = setInterval(this.checkAndUpdate.bind(this), this.options.interval);
    }
    return this;
  }

  use(plugin) {
    this.plugins.push(plugin);
    return this;
  }

  getFixedT(lng, ns) {
    return this.i18next.getFixedT(lng, ns);
  }

  stopInterval() {
    clearInterval(this.timer);
    return this;
  }

  getI18nextInstance() {
    if (!this.i18next) {
      this.i18next = this.createI18nextInstance();
    }
    return this.i18next;
  }

  createI18nextInstance() {
    this.log('info', {}, 'Create i18next instacne');
    const newI18next = i18next.createInstance();
    this.plugins.forEach(plugin => {
      newI18next.use(plugin);
    });
    return newI18next;
  }

  checkAndUpdate() {
    var version;
    var namespaces;
    var shouldUpdate = false;
    return this.getVersion()
      .then(v => version = v)
      .then(() => this.compareVersion(this.version, version))
      .then(equal => shouldUpdate = !equal)
      .then(() => shouldUpdate && this.getNamespaces())
      .then(v => namespaces = v)
      .then(() => shouldUpdate && this.update(version, namespaces));
  }

  update(version, namespaces) {
    return new Promise((resolve, reject) => {
      this.version = version;
      this.namespaces = namespaces;
      this.i18next = null;
      const i18n = this.getI18nextInstance();
      const done = err => {
        if (err && this.isFatalError(err)) {
          this.log('fatal', {
            err,
            version,
            namespaces
          }, 'Unexpected fatal error');
          reject(err);
        } else if (err) {
          this.log('error', {
            err,
            version,
            namespaces
          }, 'Failed to load resources');
          resolve();
        } else {
          resolve();
        }
      };
      i18n.init(this.getI18nextOptions(version, namespaces), done);
    });
  }
}

module.exports = I18nextManager;