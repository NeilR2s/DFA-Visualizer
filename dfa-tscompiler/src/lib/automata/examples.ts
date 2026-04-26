import { deriveCfgFromDfa } from "./cfg"
import { deriveStackPdaFromDfa } from "./pda"
import { type AutomataPreset, type DFADefinition, type MachineSamples, type Point, type StateId } from "./types"

function numberedStates(ids: number[]) {
  return ids.map((id) => ({ id, label: `q${id}` }))
}

function layoutFromEntries(entries: Array<[StateId, number, number]>): Record<string, Point> {
  return Object.fromEntries(entries.map(([id, x, y]) => [String(id), { x, y }]))
}

const betsSamples: MachineSamples = {
  accepted: [
    "aaababaabb",
    "aaabaa",
    "bbbbba",
    "abaababaa",
    "aaabab",
    "aaabaaa",
    "ababbbaabbaab",
    "baabaabab",
    "babbbaabbaa",
    "bbababb",
  ],
  rejected: ["baaababaabb", "ababaa", "aaacaa", "aaabac", "aa", "", "aaabax", "aabbb", "aaaba"],
}

const starsSamples: MachineSamples = {
  accepted: [
    "111111101",
    "010000010",
    "10111011100",
    "001011100000001",
    "1111110100011100",
    "111011111100000",
    "0101111100010",
    "1111011101",
    "10100000000000000001",
  ],
  rejected: ["000111101", "11110101001", "111111111", "111", "", "1111a11101", "1111111"],
}

const betsLayoutScale = {
  x: 1.15,
  y: 1.125,
}

const betsDfa: DFADefinition = {
  id: "bets-dfa",
  name: "BETS",
  expression: "(aa + bb + aba + ba)(aba + bab + bbb)(a + b)*(a + b + aa + abab)(aa + bb)*",
  description: "A DFA over {a, b} migrated from the original Flask implementation.",
  alphabet: ["a", "b"],
  states: numberedStates([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
  startState: 0,
  acceptingStates: [12],
  trapStates: [7, 8],
  stopOnTrap: true,
  transitions: {
    0: { a: 2, b: 1 },
    1: { a: 3, b: 3 },
    2: { a: 3, b: 4 },
    3: { a: 5, b: 6 },
    4: { a: 3, b: 7 },
    5: { a: 8, b: 9 },
    6: { a: 10, b: 10 },
    7: { a: 7, b: 7 },
    8: { a: 8, b: 8 },
    9: { a: 11, b: 8 },
    10: { a: 7, b: 11 },
    11: { a: 12, b: 12 },
    12: { a: 12, b: 12 },
  },
  layout: layoutFromEntries([
    [0, 50 * betsLayoutScale.x, 200 * betsLayoutScale.y],
    [1, 150 * betsLayoutScale.x, 100 * betsLayoutScale.y],
    [2, 150 * betsLayoutScale.x, 300 * betsLayoutScale.y],
    [3, 250 * betsLayoutScale.x, 100 * betsLayoutScale.y],
    [4, 250 * betsLayoutScale.x, 300 * betsLayoutScale.y],
    [5, 350 * betsLayoutScale.x, 50 * betsLayoutScale.y],
    [6, 350 * betsLayoutScale.x, 150 * betsLayoutScale.y],
    [7, 350 * betsLayoutScale.x, 350 * betsLayoutScale.y],
    [8, 450 * betsLayoutScale.x, 50 * betsLayoutScale.y],
    [9, 450 * betsLayoutScale.x, 150 * betsLayoutScale.y],
    [10, 450 * betsLayoutScale.x, 250 * betsLayoutScale.y],
    [11, 550 * betsLayoutScale.x, 200 * betsLayoutScale.y],
    [12, 550 * betsLayoutScale.x, 300 * betsLayoutScale.y],
  ]),
  samples: betsSamples,
}

const starsDfa: DFADefinition = {
  id: "stars-dfa",
  name: "STARS",
  expression: "(111 + 101 + 001 + 010)(1 + 0 + 11)(1 + 0 + 11)*(111 + 000)(111 + 000)*(01 + 10 + 00)",
  description: "A binary DFA migrated from the original Flask implementation.",
  alphabet: ["0", "1"],
  states: numberedStates([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]),
  startState: 0,
  acceptingStates: [10, 11, 18, 21, 22, 23],
  trapStates: [4],
  stopOnTrap: true,
  transitions: {
    0: { "0": 1, "1": 2 },
    1: { "0": 5, "1": 3 },
    2: { "0": 5, "1": 5 },
    3: { "0": 6, "1": 4 },
    4: { "0": 4, "1": 4 },
    5: { "0": 4, "1": 6 },
    6: { "0": 7, "1": 7 },
    7: { "0": 9, "1": 8 },
    8: { "0": 9, "1": 12 },
    9: { "0": 13, "1": 8 },
    10: { "0": 10, "1": 11 },
    11: { "0": 22, "1": 12 },
    12: { "0": 9, "1": 17 },
    13: { "0": 15, "1": 8 },
    14: { "0": 10, "1": 11 },
    15: { "0": 14, "1": 16 },
    16: { "0": 22, "1": 12 },
    17: { "0": 20, "1": 19 },
    18: { "0": 15, "1": 8 },
    19: { "0": 23, "1": 19 },
    20: { "0": 18, "1": 21 },
    21: { "0": 9, "1": 12 },
    22: { "0": 13, "1": 8 },
    23: { "0": 18, "1": 21 },
  },
  layout: layoutFromEntries([
    [0, 50, 270],
    [1, 130, 205],
    [2, 130, 335],
    [3, 220, 155],
    [5, 220, 270],
    [6, 315, 240],
    [4, 315, 455],
    [7, 410, 245],
    [9, 475, 360],
    [8, 515, 210],
    [12, 560, 350],
    [13, 580, 255],
    [14, 655, 185],
    [15, 620, 435],
    [16, 665, 345],
    [17, 705, 455],
    [10, 710, 80],
    [11, 790, 155],
    [18, 790, 295],
    [19, 790, 420],
    [20, 610, 520],
    [22, 725, 520],
    [21, 850, 405],
    [23, 850, 520],
  ]),
  samples: starsSamples,
}

function createPreset(dfa: DFADefinition): AutomataPreset {
  return {
    id: dfa.id,
    name: dfa.name,
    summary: dfa.expression,
    dfa,
    cfg: deriveCfgFromDfa(dfa),
    pda: deriveStackPdaFromDfa(dfa),
  }
}

export const AUTOMATA_PRESETS: AutomataPreset[] = [createPreset(betsDfa), createPreset(starsDfa)]
