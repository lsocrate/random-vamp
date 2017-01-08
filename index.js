const chance = require('chance')();
const _ = require('lodash');

const SURVIVABILITY = 50;

const hMap = {
  '0': { loss: 0, gain: 0 },
  '1': { loss: 1, gain: 34 },
  '2': { loss: 2, gain: 21 },
  '3': { loss: 3, gain: 13 },
  '4': { loss: 5, gain: 8 },
  '5': { loss: 8, gain: 5 },
  '6': { loss: 13, gain: 3 },
  '7': { loss: 21, gain: 2 },
  '8': { loss: 34, gain: 1 },
  '9': { loss: 55, gain: 1 },
  '10': { loss: 89, gain: 0 },
};

function vamp (targetAge, vampBase = {}, embraceCb) {
  const v = _.defaults(vampBase, {
    name: chance.name(),
    clan: chance.pick(['Daeva', 'Gangrel', 'Mekhet', 'Nosferatu', 'Ventrue']),
    humanity: 7,
    age: 0,
    children: 0,
    beats: 0,
    xp: 0,
    sire: undefined
  });

  function embrace() {
    v.children++;
    embraceCb(_.clone(v));
  }

  while (targetAge > v.age) {
    const hRoll = chance.d100();
    const {loss, gain} = hMap[v.humanity];
    if (hRoll <= loss + gain) {
      if (hRoll <= loss) {
        const embraceChance = chance.d100();
        if (v.humanity <= 7 && embraceChance <= 8) {
          embrace();
        } else if (v.humanity <= 8 && embraceChance <= 3) {
          embrace();
        } else if (v.humanity <= 9 && embraceChance <= 2) {
          embrace();
        } else if (v.humanity <= 10 && embraceChance <= 1) {
          embrace();
        }

        v.humanity--;
      } else {
        v.humanity++;
      }
    }

    if (v.humanity <= 0) {
      console.log('Lost to the beast');
      break;
    }

    v.age++;

    if (chance.d100() <= 50) {
      v.beats++;
      if (v.beats === 5) {
        v.beats = 0;
        v.xp++;
      }
    }

    const rollToDie = chance.d100();
    const chanceOfDeath = 100 / (SURVIVABILITY * Math.log10(v.age + 1));
    if (rollToDie <= chanceOfDeath) {
      console.log('Met final death');
      break;
    }
  }

  return v;
}

function handleChilde (sire) {
  const {age, clan} = sire;
  const childe = vamp(age, {clan, sire: sire.name}, handleChilde);
  console.log('A childe', childe);

}
const dude = vamp(parseInt(process.argv[2]), {}, handleChilde);
console.log('The methuselah', dude);
