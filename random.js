const Tree = require('data-structures-javascript').Tree
const _ = require('lodash')
const chance = require('chance')();
const prettyTree = require('pretty-tree')

const Vampire = require('./model/vampire')

const { log10, log2, max, min, pow } = Math;

const clan = process.argv[2]
const startYear = parseInt(process.argv[3], 10)
const endYear = parseInt(process.argv[4], 10)

const humanityDerivations = new Map(_.times(11, function (h) {
  const antiH = 10 - h
  const humanityLossChance = h && 5 * pow(2, h / 3) / 100
  const humanityGainChance = antiH && 4 * pow(2, antiH / 3) / 100
  const torporLength = h === 0 ? 100 :
                 h === 1 ? 50 :
                 h === 2 ? 10 :
                 h === 3 ? 5 :
                 h === 4 ? 1 :
                 h === 5 ? 1/12 :
                 h === 6 ? 1/52 :
                 h === 7 ? 1/52 :
                 h === 8 ? 2/365 :
                 h === 9 ? 2/365 : 1/365
  return [h, { humanityLossChance, humanityGainChance, torporLength }]
}))

function charName () {
  return chance.name({middle: true})
}

function test (pct) {
  pct = pct > 1 ? pct / 100 : pct
  return Math.random() <= pct
}

const founder = new Vampire({
  clan,
  name: charName(),
  embracedIn: startYear,
  age: 0,
  status: 'active',
  generation: 1
})
founder.log = []

const lineage = new Tree(founder)

function live (node) {
  const char = node.value

  let bpCounter = 0;
  let yearsInTorpor = 0
  let torporTarget = 0
  function fallIntoTorpor () {
    const humanity = char.get('humanity')
    const bloodPotence = char.get('bloodPotence')
    bpCounter = 0
    torporTarget = humanityDerivations.get(humanity).torporLength * bloodPotence
    char.set('status', 'torpor')
  }
  function raiseFromTorpor () {
    const bloodPotence = char.get('bloodPotence')
    const currentAge = char.get('age')
    bpCounter = 0
    torporTarget = 0
    char.set('status', 'active')
    char.log.push(`RAISED FROM TORPOR BP ${bloodPotence} AGE ${currentAge}`)
  }

  let children = 0
  char.on('humanity loss', sire => {
    const age = sire.get('age')
    const humanity = sire.get('humanity')
    if (
      (humanity <= 7 && test(.1)) ||
      (humanity > 7 && test(.05))
    ) {
      children++
      char.log.push(`EMBRACED #${children} AT AGE ${age} AND HUMANITY ${humanity}`)

      const child = new Vampire({
        clan: sire.get('clan'),
        name: charName(),
        embracedIn: sire.get('embracedIn') + sire.get('age'),
        age: 0,
        status: 'active',
        generation: sire.get('generation') + 1,
        sire: sire
      })
      child.log = []
      const childNode = node.addChild(child)
      live(childNode)
    }
  })

  for (let currentYear = char.get('embracedIn') + char.get('age') ; currentYear < endYear ; currentYear++) {
    const humanity = char.get('humanity')
    let chanceToGainExtraBeat = 40

    const currentAge = char.get('age') + 1
    char.set('age', currentAge)

    /**
     * Blood potence
     */
    if (char.get('status') === 'active') {
      bpCounter++
    } else {
      bpCounter--
    }
    if (bpCounter === 50) {
      char.increase('bloodPotence')
      bpCounter = 0
    } else if (bpCounter === -25) {
      char.decrease('bloodPotence')
      bpCounter = 0
    }

    const bloodPotence = char.get('bloodPotence')

    /**
     * Skip year when not active
     */
    if (char.get('status') === 'torpor') {
      yearsInTorpor++
      if (yearsInTorpor >= torporTarget) {
        raiseFromTorpor()
      } else {
        const chanceToDieInTorpor = (log10(yearsInTorpor + 1) / 50) / log10(currentAge + 1);
        if (test(chanceToDieInTorpor)) {
          char.set('status', 'destroyed')
          char.log.push(`DESTROYED WHILE IN TORPOR BP ${bloodPotence} AGE ${currentAge}`)
          break
        }
      }
      continue
    }


    /**
     * Humanity
     */
    const {
      humanityGainChance,
      humanityLossChance
    } = humanityDerivations.get(humanity)
    if (test(humanityLossChance)) {
      char.decrease('humanity')
      chanceToGainExtraBeat += 10
    } else if (test(humanityGainChance)) {
      char.increase('humanity')
    }
    if (char.get('humanity') < 1) {
      char.log.push(`LOST TO THE BEAST BP ${bloodPotence} AGE ${currentAge}`)
      char.set('status', 'lost')
      break
    }

    const missfortune = 1 / (100 * log10(currentAge + 1))
    if (test(missfortune)) {
      if (test(.5)) {
        char.log.push(`DESTROYED BY MISSFORTUNE BP ${bloodPotence} AGE ${currentAge}`)
        char.set('status', 'destroyed')
        break
      } else {
        char.log.push(`TORPOR BY MISSFORTUNE BP ${bloodPotence} AGE ${currentAge}`)
        fallIntoTorpor()
        continue
      }
    }

    const torporChance = ((bloodPotence - 5) * log2(bloodPotence)) / 100
    if (test(torporChance)) {
      char.log.push(`TORPOR BY MISSFORTUNE BP ${bloodPotence} AGE ${currentAge}`)
      fallIntoTorpor()
      continue
    }

    char.increase('beats')
    if (test(chanceToGainExtraBeat / 100)) {
      char.increase('beats')
    }
  }
}

live(lineage)

let higherGeneration = 1
let oldestActive = lineage.value
let linActive = 0
let linTorpor = 0
let linDestroyed = 0
let linLost = 0

function vampireToString (char) {
  const generation = char.get('generation')
  const name = char.get('name')
  const age = char.get('age')
  const status = char.get('status')
  const embrace = char.get('embracedIn')
  const humanity = char.get('humanity')
  const xp = char.get('xp')
  const icon = status === 'active' ? '•' : status === 'torpor' ? 'T' : '✝'

  switch (status) {
    case 'active':
      linActive++
      break
    case 'torpor':
      linTorpor++
      break
    case 'destroyed':
      linDestroyed++
      break
    case 'lost':
      linLost++
      break
  }

  higherGeneration = Math.max(higherGeneration, generation)
  if (status === 'active' && age > oldestActive.get('age')) {
    oldestActive = char
  }

  return `${icon} ${name} (${generation}th gen) Embraced in ${embrace}, ${age} years, ${humanity} humanity, ${xp} xp. ${status}`
}

function treeToObj (node) {
  const item = {
    label: vampireToString(node.value),
    nodes: [],
    leaf: {}
  }
  node.children.forEach(child => {
    if (child.children.length > 1) {
      item.nodes.push(treeToObj(child))
    } else {
      item.leaf[child.value.get('name')] = vampireToString(child.value)
    }
  })
  if (!item.nodes.length) {
    delete item.nodes
  }
  return item
}

const linObj = treeToObj(lineage)

console.log('==========')
const linTotal = linActive + linTorpor + linDestroyed + linLost
console.log(`Lineage count: total ${linTotal}, active ${linActive}, torpor ${linTorpor}, destroyed ${linDestroyed}, lost ${linLost}`)
console.log(`Higher Gen: ${higherGeneration}`)
console.log(`Standing Elder: ${oldestActive.get('name')} (${oldestActive.get('generation')}) Embraced in ${oldestActive.get('embracedIn')}, ${oldestActive.get('age')} years.`)
console.log('==========')
console.log(prettyTree(linObj))
