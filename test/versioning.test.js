const path = require('path');
const { expect } = require('chai');
const Backend = require('i18next-node-fs-backend');
const I18nextManager = require('../');

describe('versioing', () => {
  describe('.checkAndUpdate', () => {
    describe('when version is matched', () => {
      it('should not reload any resources', () => {
        const manager = new I18nextManager({
          interval: 0,
          getVersion: () => Promise.resolve('1.0.1'),
          getNamespaces: () => Promise.resolve(['default']),
          getI18nextOptions: (version, namespaces) => ({
            lng: 'zh',
            lngs: ['zh', 'en'],
            fallbackLng: 'zh',
            ns: namespaces,
            defaultNS: 'default',
            backend: {
              loadPath: path.resolve(__dirname, `locales/${version}.{{lng}}.{{ns}}.json`)
            }
          })
        });
        manager.use(Backend);
        manager.namespaces = [];
        manager.version = '1.0.1';
        return manager.checkAndUpdate()
          .then(() => {
            expect(manager.namespaces).to.deep.equal([]);
          });
      });
    });

    describe('when version is not matched', () => {
      it('should reload all resources', () => {
        const manager = new I18nextManager({
          interval: 0,
          getVersion: () => Promise.resolve('1.0.1'),
          getNamespaces: () => Promise.resolve(['default']),
          getI18nextOptions: (version, namespaces) => ({
            lng: 'zh',
            lngs: ['zh', 'en'],
            fallbackLng: 'zh',
            ns: namespaces,
            defaultNS: 'default',
            backend: {
              loadPath: path.resolve(__dirname, `locales/${version}.{{lng}}.{{ns}}.json`)
            }
          })
        });
        manager.use(Backend);
        return manager.checkAndUpdate()
          .then(() => {
            const i18n = manager.getI18nextInstance();
            expect(i18n.t('ns')).to.equal('default');
            expect(i18n.t('lng')).to.equal('zh');
            expect(i18n.t('version')).to.equal('1.0.1');
            expect(manager.version).to.equal('1.0.1');
            expect(manager.namespaces).to.deep.equal(['default']);
          });
      });
    });
  });
});