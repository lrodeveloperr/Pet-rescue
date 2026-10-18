// Every animal that can be rescued. Companions lend abilities; friends go home to the garden.
import { COMPANIONS } from './logic.js';

// Friends introduced by each world (world 1 also introduces the four companions).
export const WORLD_FRIENDS = [
  ['kitten', 'bunny', 'piglet', 'chick', 'hamster', 'lamb', 'fox', 'panda'],
  ['otter', 'beaver', 'raccoon', 'hedgehog'],
  ['penguin', 'polarbear', 'arcticfox', 'owl'],
  ['calf', 'foal', 'goat', 'rooster'],
  ['meerkat', 'coyote', 'fawn', 'ram'],
  ['squirrel', 'bearcub', 'redpanda', 'wolfpup'],
];

export const FRIENDS = WORLD_FRIENDS.flat();
export const ALL_ANIMALS = [...COMPANIONS, ...FRIENDS];

// Voice used for each animal (see SoundEngine.voice).
export const VOICE = {
  otter: 'hamster', beaver: 'piglet', raccoon: 'kitten', hedgehog: 'mole',
  penguin: 'duck', polarbear: 'panda', arcticfox: 'fox', owl: 'hoot',
  calf: 'moo', foal: 'neigh', goat: 'lamb', rooster: 'crow',
  meerkat: 'hamster', coyote: 'howl', fawn: 'bunny', ram: 'lamb',
  squirrel: 'chick', bearcub: 'panda', redpanda: 'kitten', wolfpup: 'howl',
};

export const voiceOf = (kind) => VOICE[kind] ?? kind;
