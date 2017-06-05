const { expect } = require('chai');

describe('a truth', () => {
  it('is async', (done) => {
    expect(4).to.equal(4);
    done();
  });
});