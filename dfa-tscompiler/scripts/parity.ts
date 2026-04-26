import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import process from "node:process"

import { simulateCfg } from "../src/lib/automata/cfg.ts"
import { simulateDfa } from "../src/lib/automata/dfa.ts"
import { AUTOMATA_PRESETS } from "../src/lib/automata/examples.ts"
import { simulatePda } from "../src/lib/automata/pda.ts"
import { type StateId } from "../src/lib/automata/types.ts"

type PythonDfaResult = {
  accepted: boolean
  final_state: StateId
  state_sequence: Array<StateId | string>
  error: string | null
}

type PythonCfgResult = {
  accepted: boolean
  sequence: string[][]
  error: string | null
}

type PythonPdaStep = {
  state: StateId
  stack: string[]
  consumed: string
  remaining: string
}

type PythonPdaResult = {
  accepted: boolean
  sequence: PythonPdaStep[]
  error: string | null
}

type PythonParityOutput = Record<
  string,
  {
    dfa: Record<string, PythonDfaResult>
    cfg: Record<string, PythonCfgResult>
    pda: Record<string, PythonPdaResult>
  }
>

type ParityCases = Record<string, { dfa: string[]; cfg: string[]; pda: string[] }>

const cases: ParityCases = {}

for (const preset of AUTOMATA_PRESETS) {
  const dfaInputs = unique([...preset.dfa.samples.accepted, ...preset.dfa.samples.rejected, ...generateStrings(preset.dfa.alphabet, 3)])
  const cfgInputs = unique([
    ...preset.cfg.samples.accepted.slice(0, 2),
    ...preset.cfg.samples.rejected.slice(0, 2),
    ...generateStrings(preset.dfa.alphabet, 2),
  ])

  cases[preset.id] = {
    dfa: dfaInputs,
    cfg: cfgInputs,
    pda: dfaInputs,
  }
}

const pythonOutput = runPythonOracle(JSON.stringify({ presets: AUTOMATA_PRESETS, cases }))
const oracle = JSON.parse(pythonOutput) as PythonParityOutput

for (const preset of AUTOMATA_PRESETS) {
  const oraclePreset = oracle[preset.id]
  assert.ok(oraclePreset, `Missing Python oracle output for ${preset.id}`)

  for (const input of cases[preset.id].dfa) {
    const tsResult = simulateDfa(preset.dfa, input)
    const pyResult = oraclePreset.dfa[input]
    assert.equal(tsResult.accepted, pyResult.accepted, `${preset.id} DFA acceptance mismatch for ${input || "ε"}`)
    assert.equal(tsResult.finalState, pyResult.final_state, `${preset.id} DFA final state mismatch for ${input || "ε"}`)
    assert.deepEqual(tsResult.stateSequence, pyResult.state_sequence, `${preset.id} DFA trace mismatch for ${input || "ε"}`)
  }

  for (const input of cases[preset.id].cfg) {
    const tsResult = simulateCfg(preset.cfg, input)
    const pyResult = oraclePreset.cfg[input]
    assert.equal(tsResult.accepted, pyResult.accepted, `${preset.id} CFG acceptance mismatch for ${input || "ε"}`)

    if (tsResult.accepted) {
      assert.deepEqual(tsResult.sequence, pyResult.sequence, `${preset.id} CFG derivation mismatch for ${input || "ε"}`)
    }
  }

  for (const input of cases[preset.id].pda) {
    const tsResult = simulatePda(preset.pda, input)
    const pyResult = oraclePreset.pda[input]
    assert.equal(tsResult.accepted, pyResult.accepted, `${preset.id} PDA acceptance mismatch for ${input || "ε"}`)
    assert.deepEqual(
      tsResult.sequence.map((step) => step.state),
      pyResult.sequence.map((step) => step.state),
      `${preset.id} PDA state path mismatch for ${input || "ε"}`
    )
    assert.deepEqual(
      tsResult.sequence.map((step) => step.stack),
      pyResult.sequence.map((step) => step.stack),
      `${preset.id} PDA stack trace mismatch for ${input || "ε"}`
    )
  }
}

console.log("TypeScript engines match the existing Python engines.")

function runPythonOracle(payload: string): string {
  for (const command of ["python3", "python"]) {
    const result = spawnSync(command, ["-c", getPythonOracle()], {
      cwd: process.cwd(),
      input: payload,
      encoding: "utf8",
    })

    if (result.error) {
      continue
    }

    if (result.status !== 0) {
      throw new Error(result.stderr || `${command} oracle failed with status ${result.status}`)
    }

    return result.stdout
  }

  throw new Error("Python is required for parity tests, but neither python3 nor python was available.")
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

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

function getPythonOracle(): string {
  return String.raw`
import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.getcwd(), "../backend")))

from dfa_logic import DFA
from cfg_logic import CFG
from pda_logic import PDA

payload = json.load(sys.stdin)
output = {}

def numeric_key(value):
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.lstrip("-").isdigit():
        return int(value)
    return value

def make_dfa(definition):
    states = set(state["id"] for state in definition["states"])
    transitions = {}
    for source, paths in definition["transitions"].items():
        transitions[numeric_key(source)] = {symbol: target for symbol, target in paths.items()}
    return DFA(
        states=states,
        alphabet=set(definition["alphabet"]),
        transitions=transitions,
        start_state=definition["startState"],
        final_states=set(definition["acceptingStates"]),
        trap_states=set(definition.get("trapStates") or []),
    )

def make_cfg(definition):
    return CFG(
        variables=set(definition["variables"]),
        terminals=set(definition["terminals"]),
        rules=[{"from": rule["from"], "to": rule["to"]} for rule in definition["rules"]],
        start_symbol=definition["startSymbol"],
    )

def make_pda(definition):
    transitions = {}
    for transition in definition["transitions"]:
        transitions.setdefault(transition["from"], {})
        transitions[transition["from"]].setdefault(transition["input"], {})
        transitions[transition["from"]][transition["input"]].setdefault(transition["stackTop"], [])
        transitions[transition["from"]][transition["input"]][transition["stackTop"]].append((transition["to"], transition["push"]))
    return PDA(
        states=set(state["id"] for state in definition["states"]),
        input_alphabet=set(definition["inputAlphabet"]),
        stack_alphabet=set(definition["stackAlphabet"]),
        transitions=transitions,
        start_state=definition["startState"],
        initial_stack=definition["initialStackSymbol"],
        final_states=set(definition["acceptingStates"]),
    )

for preset in payload["presets"]:
    preset_id = preset["id"]
    dfa = make_dfa(preset["dfa"])
    cfg = make_cfg(preset["cfg"])
    pda = make_pda(preset["pda"])
    output[preset_id] = {"dfa": {}, "cfg": {}, "pda": {}}

    for input_value in payload["cases"][preset_id]["dfa"]:
        output[preset_id]["dfa"][input_value] = dfa.simulate(input_value)

    for input_value in payload["cases"][preset_id]["cfg"]:
        output[preset_id]["cfg"][input_value] = cfg.simulate(input_value)

    for input_value in payload["cases"][preset_id]["pda"]:
        output[preset_id]["pda"][input_value] = pda.simulate(input_value)

print(json.dumps(output))
`
}
