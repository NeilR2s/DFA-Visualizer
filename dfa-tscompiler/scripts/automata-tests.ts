import assert from "node:assert/strict"

import { simulateCfg } from "../src/lib/automata/cfg.ts"
import { simulateDfa } from "../src/lib/automata/dfa.ts"
import { AUTOMATA_PRESETS } from "../src/lib/automata/examples.ts"
import { simulatePda } from "../src/lib/automata/pda.ts"

for (const preset of AUTOMATA_PRESETS) {
  for (const input of preset.dfa.samples.accepted) {
    assert.equal(simulateDfa(preset.dfa, input).accepted, true, `${preset.id} DFA should accept ${input}`)
    assert.equal(simulatePda(preset.pda, input).accepted, true, `${preset.id} PDA should accept ${input}`)
  }

  for (const input of preset.dfa.samples.rejected) {
    assert.equal(simulateDfa(preset.dfa, input).accepted, false, `${preset.id} DFA should reject ${input}`)
    assert.equal(simulatePda(preset.pda, input).accepted, false, `${preset.id} PDA should reject ${input}`)
  }

  for (const input of generateStrings(preset.dfa.alphabet, 4)) {
    const dfaResult = simulateDfa(preset.dfa, input)
    const pdaResult = simulatePda(preset.pda, input)
    assert.equal(pdaResult.accepted, dfaResult.accepted, `${preset.id} PDA should match DFA for ${input || "ε"}`)
  }

  for (const input of [...preset.cfg.samples.accepted.slice(0, 2), ...preset.cfg.samples.rejected.slice(0, 2)]) {
    const dfaResult = simulateDfa(preset.dfa, input)
    const cfgResult = simulateCfg(preset.cfg, input)
    assert.equal(cfgResult.accepted, dfaResult.accepted, `${preset.id} CFG should match DFA for ${input || "ε"}`)
  }
}

console.log("Automata TypeScript tests passed.")

function generateStrings(alphabet: string[], maxLength: number): string[] {
  const generated = [""]

  for (let length = 1; length <= maxLength; length += 1) {
    const previousLayer = generated.filter((value) => value.length === length - 1)
    for (const prefix of previousLayer) {
      for (const symbol of alphabet) {
        generated.push(`${prefix}${symbol}`)
      }
    }
  }

  return generated
}
