const { expect } = require('chai');
const I18nextManager = require('../');

describe('log', () => {
  it('should work', done => {
    const manager = new I18nextManager({
      interval: 0,
      log(level, meta, msg) {
        try {
          expect(level).to.equal('info');
          expect(meta).to.deep.equal({});
          expect(msg).to.equal('Create i18next instacne');
          done();
        } catch (e) {
          done(e);
        }
      }
    });
  });
});