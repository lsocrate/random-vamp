const EventEmitter = require('events');

const Health = require('./health')

const BASE_DATA = {
  humanity: 7,
  beats: 0,
  xp: 0,
  bloodPotence: 1,
  attribute: {
    intelligence: 1,
    wits: 1,
    resolve: 1,
    strength: 1,
    dexterity: 1,
    stamina: 1,
    presence: 1,
    manipulation: 1,
    composure: 1,
  },
  skill: {
    academics: { value: 0, specialties: [] },
    computer: { value: 0, specialties: [] },
    crafts: { value: 0, specialties: [] },
    investigation: { value: 0, specialties: [] },
    medicine: { value: 0, specialties: [] },
    occult: { value: 0, specialties: [] },
    science: { value: 0, specialties: [] },
    athletics: { value: 0, specialties: [] },
    brawl: { value: 0, specialties: [] },
    drive: { value: 0, specialties: [] },
    firearms: { value: 0, specialties: [] },
    larceny: { value: 0, specialties: [] },
    stealth: { value: 0, specialties: [] },
    survival: { value: 0, specialties: [] },
    weaponry: { value: 0, specialties: [] },
    animalKen: { value: 0, specialties: [] },
    empathy: { value: 0, specialties: [] },
    expression: { value: 0, specialties: [] },
    intimidation: { value: 0, specialties: [] },
    persuasion: { value: 0, specialties: [] },
    socialize: { value: 0, specialties: [] },
    streetwise: { value: 0, specialties: [] },
    subterfuge: { value: 0, specialties: [] },
  },
  disciplines: [],
  merits: [],
  size: 5,
}
const ATTRIBUTES = Object.keys(BASE_DATA.attribute)
const SKILLS = Object.keys(BASE_DATA.skill)

class Vampire extends EventEmitter {
  constructor (data) {
    super()
    this._data = Object.assign(data, BASE_DATA)

    this.health = new Health({
      size: this.get('size'),
      stamina: this.get('stamina'),
    })
    this.on('stamina changed', stamina => this.health.set('stamina', stamina))
    this.on('beats changed', beats => {
      if (beats >= 5) {
        this.set('beats', beats - 5)
        this.increase('xp')
      }
    })
  }

  get (prop) {
    if (ATTRIBUTES.includes(prop)) {
      return this._data.attribute[prop];
    }
    if (SKILLS.includes(prop)) {
      return this._data.skill[prop];
    }
    return this._data[prop]
  }

  set (prop, value) {
    if (ATTRIBUTES.includes(prop)) {
      this._data[prop] = value
    } else if (SKILLS.includes(prop)) {
      this._data.skill[prop].value = value
    } else if (prop === 'humanity') {
      const oldValue = this.get('humanity')
      if (oldValue > value) {
        this.emit('humanity loss', this)
      } else if (oldValue < value) {
        this.emit('humanity gain', this)
      }
      this._data[prop] = value
    } else {
      this._data[prop] = value
    }
    this.emit(`${prop} changed`, value)
    return this
  }

  increase (prop, amount = 1) { this.set(prop, this.get(prop) + amount) }
  decrease (prop, amount = 1) { this.set(prop, Math.max(0, this.get(prop) - amount)) }
}

module.exports = Vampire
