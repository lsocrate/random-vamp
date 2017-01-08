/* eslint-env mocha */

const expect = require('chai').expect
const Health = require('../../model/health')

const { CLEAN, BASHING, LETHAL, AGGRAVATED } = Health;

describe('Health', function () {
  it('returns health calculated object', function () {
    const health = new Health({size: 5, stamina: 2, resilience: 3})
    expect(health.boxes).to.equal(10)
  })
  it('handles damage penalties', function () {
    const health = new Health({size: 5, stamina: 2})
    expect(health.penalties).to.equal(0)
    health.injure(BASHING)
    expect(health.penalties).to.equal(0)
    health.injure(BASHING)
    expect(health.penalties).to.equal(0)
    health.injure(BASHING)
    expect(health.penalties).to.equal(0)
    health.injure(BASHING)
    expect(health.penalties).to.equal(0)
    health.injure(BASHING)
    expect(health.penalties).to.equal(1)
    health.injure(BASHING)
    expect(health.penalties).to.equal(2)
    health.injure(BASHING)
    expect(health.penalties).to.equal(3)
  })
  it('keeps damage in the right order', function () {
    const health = new Health({size: 20, stamina: 5})
    health.injure(BASHING)
    health.injure(LETHAL)
    health.injure(AGGRAVATED)
    health.injure(LETHAL)
    health.injure(AGGRAVATED)
    health.injure(BASHING)
    health.injure(AGGRAVATED)
    health.injure(BASHING)
    health.injure(LETHAL)
    health.injure(LETHAL)
    health.injure(BASHING)
    health.injure(AGGRAVATED)
    health.injure(BASHING)
    health.injure(AGGRAVATED)
    health.injure(LETHAL)
    health.injure(AGGRAVATED)
    health.injure(LETHAL)
    health.injure(BASHING)
    health.injure(LETHAL)
    health.injure(BASHING)
    health.injure(AGGRAVATED)
    expect(health.track).to.deep.equal([
      AGGRAVATED,
      AGGRAVATED,
      AGGRAVATED,
      AGGRAVATED,
      AGGRAVATED,
      AGGRAVATED,
      AGGRAVATED,
      LETHAL,
      LETHAL,
      LETHAL,
      LETHAL,
      LETHAL,
      LETHAL,
      LETHAL,
      BASHING,
      BASHING,
      BASHING,
      BASHING,
      BASHING,
      BASHING,
      BASHING,
      CLEAN,
      CLEAN,
      CLEAN,
      CLEAN,
    ])
  })
  it('handles resilience effects', function () {
    const health = new Health({size: 5, stamina: 2, resilience: 3})
    health.injure(AGGRAVATED, 5)
    expect(health.track).to.deep.equal([
      AGGRAVATED,
      AGGRAVATED,
      LETHAL,
      LETHAL,
      LETHAL,
      CLEAN,
      CLEAN,
      CLEAN,
      CLEAN,
      CLEAN,
    ])

    health.injure(AGGRAVATED, 2, { noResilience: true })
    expect(health.track).to.deep.equal([
      AGGRAVATED,
      AGGRAVATED,
      AGGRAVATED,
      AGGRAVATED,
      LETHAL,
      LETHAL,
      LETHAL,
      CLEAN,
      CLEAN,
      CLEAN,
    ])
  })
})
