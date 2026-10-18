// Level maps. Legend (see logic.js): . grass  # tree  ~ water  _ gap  H hedge
// B boulder  S start  E home.  Cages: P puppy F frog D duck M mole
// K kitten N bunny G piglet C chick A hamster L lamb X fox Y panda.
// Every level is checked by test/levels.test.js: it must be solvable with the
// companions rescued in earlier levels, and introduction levels must need the new ability.

export const LEVELS = [
  {
    id: 1,
    // Walk only. Rescue the puppy, then go home.
    map: [
      '#######',
      '#..E..#',
      '#.###.#',
      '#.#P..#',
      '#.#####',
      '#..S..#',
      '#######',
    ],
  },
  {
    id: 2,
    // Puppy pushes the boulder into the pond to make a crossing. Frog hops home.
    map: [
      '#########',
      '#E_.F...#',
      '#######.#',
      '#S..B.~.#',
      '#########',
    ],
  },
  {
    id: 3,
    // Frog hops to the duck; switch back to frog, then duck swims home.
    map: [
      '########',
      '#E~~...#',
      '######.#',
      '#D._...#',
      '######.#',
      '#S.....#',
      '########',
    ],
  },
  {
    id: 4,
    // Duck swims to the mole; mole digs through the hedge to get home.
    map: [
      '########',
      '#E.H...#',
      '#####..#',
      '#M.~~..#',
      '#####..#',
      '#S.....#',
      '########',
    ],
  },
  {
    id: 5,
    // Two-wide gap: the puppy fills one tile, the frog hops the other.
    map: [
      '##########',
      '#S..B__.K#',
      '#E########',
      '##########',
    ],
  },
  {
    id: 6,
    // Sink the boulder for a dry tile beside the hedge, then the mole digs.
    map: [
      '#########',
      '#S......#',
      '#.###B###',
      '#E..#~HN#',
      '#########',
    ],
  },
  {
    id: 7,
    // You cannot switch companions while swimming: make a dry tile before the gap.
    map: [
      '##########',
      '#S.......#',
      '#####B####',
      '#E~~~~_.G#',
      '##########',
    ],
  },
  {
    id: 8,
    // Dig the hedge from the far side first, then roll the boulder through it.
    map: [
      '############',
      '#S.B.H.__.C#',
      '#.####.#####',
      '#E.....#####',
      '############',
    ],
  },
  {
    id: 9,
    // Two shafts: each needs a sunk boulder for a dry tile, then a different ability.
    map: [
      '#########',
      '#S......#',
      '###B#B###',
      '###.#.###',
      '###~#~###',
      '###_#H###',
      '#E..#..A#',
      '#########',
    ],
  },
  {
    id: 10,
    // Swim to the island, switch to the puppy on dry land, then dig down.
    map: [
      '##########',
      '#S.~~.B~.#',
      '#.######H#',
      '#E######L#',
      '##########',
    ],
  },
  {
    id: 11,
    // Open garden with more than one route.
    map: [
      '###########',
      '#S...#....#',
      '#.#B.H.B#.#',
      '#.#.###.#.#',
      '#.~..#.._.#',
      '##_#.#.#H.#',
      '#....#.~~.#',
      '#E##B..#.X#',
      '###########',
    ],
  },
  {
    id: 12,
    // Finale: every companion is needed once.
    map: [
      '###########',
      '#S~~._....#',
      '#.#######.#',
      '#.#Y.H~B..#',
      '#E#########',
      '###########',
    ],
  },
];
