const _ = require('lodash')

const CLEAN = Symbol('No damage')
const BASHING = Symbol('Bashing damage')
const LETHAL = Symbol('Lethal damage')
const AGGRAVATED = Symbol('Aggravated damage')
const DAMAGE_ORDER = [AGGRAVATED, LETHAL, BASHING, CLEAN];

function sortDamage (a, b) {
  return DAMAGE_ORDER.indexOf(a) - DAMAGE_ORDER.indexOf(b);
}

function pushTrack (input, list) {
  list.unshift(input)
  list.sort(sortDamage)
  return list.pop()
}

module.exports = class Health {
  static get CLEAN () { return CLEAN }
  static get BASHING () { return BASHING }
  static get LETHAL () { return LETHAL }
  static get AGGRAVATED () { return AGGRAVATED }

  constructor ({size, stamina, resilience}) {
    this.size = size || 0
    this.stamina = stamina || 0
    this.resilience = resilience || 0

    this.track = _.times(this.boxes, _.constant(CLEAN))
  }

  get boxes () {
    return this.size + this.stamina + this.resilience
  }

  get isDestroyed () {
    return _.last(this.track) === AGGRAVATED
  }

  get penalties () {
    const firstClean = this.track.indexOf(CLEAN)
    if (firstClean === -1) {
      return 3
    } else if (firstClean === this.track.length - 1) {
      return 2
    } else if (firstClean === this.track.length - 2) {
      return 1
    } else {
      return 0
    }
  }

  _injure (type) {
    switch (pushTrack(type, this.track)) {
      case BASHING:
        pushTrack(LETHAL, this.track)
        break
      case LETHAL:
        pushTrack(AGGRAVATED, this.track)
        break
    }
  }

  injure (type, qty = 1, options = {}) {
    const marks = _.times(qty, _.constant(type))
    if (!options.noResilience && type === AGGRAVATED && this.resilience > 0) {
      const letals = _.times(this.resilience, _.constant(LETHAL))
      marks.splice(0, this.resilience, ...letals)
    }
    marks.forEach(type => this._injure(type))
  }

  heal () {
    if (_.first(_.pullAt(this.track, _.indexOf(this.track, BASHING)))) {
      this.track.push(CLEAN)
    } else if (_.first(_.pullAt(this.track, _.indexOf(this.track, LETHAL)))) {
      this.track.push(CLEAN)
    } else if (_.first(_.pullAt(this.track, _.indexOf(this.track, AGGRAVATED)))) {
      this.track.push(CLEAN)
    }
  }


  toString () {
    return this.track.reduce(function (str, box) {
      switch (box) {
        case CLEAN:
          str += '[ ]'
          break
        case BASHING:
          str += '[-]'
          break
        case LETHAL:
          str += '[X]'
          break
        case AGGRAVATED:
          str += '[*]'
          break
      }

      return str
    }, '')
  }
}
