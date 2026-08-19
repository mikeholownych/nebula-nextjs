import { SIGNAL_REGISTRY, SIGNAL_COUNT, SIGNAL_KEYS, RETIRED_SIGNALS } from '@/config/signals'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const canonJson = JSON.parse(
  readFileSync(resolve(__dirname, '../config/signals.canon.json'), 'utf8')
)

describe('Signal Registry', () => {
  it('has exactly the expected number of signals', () => {
    expect(SIGNAL_REGISTRY.signals.length).toBe(9)
    expect(SIGNAL_COUNT).toBe(9)
  })

  it('matches signals.canon.json count', () => {
    expect(SIGNAL_REGISTRY.signals.length).toBe(canonJson.count)
  })

  it('signal labels match signals.canon.json entries', () => {
    const registryLabels = SIGNAL_REGISTRY.signals.map(s => s.label.toLowerCase())
    for (const canonSignal of canonJson.signals) {
      expect(registryLabels).toContain(canonSignal.toLowerCase())
    }
  })

  it('no retired signals appear in active registry', () => {
    const activeKeys = SIGNAL_KEYS
    const activeLabels = SIGNAL_REGISTRY.signals.map(s => s.label.toLowerCase())
    for (const retired of RETIRED_SIGNALS) {
      expect(activeKeys).not.toContain(retired)
      expect(activeLabels).not.toContain(retired)
    }
  })

  it('every signal has required fields', () => {
    for (const signal of SIGNAL_REGISTRY.signals) {
      expect(signal.key).toBeTruthy()
      expect(signal.label).toBeTruthy()
      expect(signal.description).toBeTruthy()
      expect(signal.passDescription).toBeTruthy()
      expect(['conversion', 'technical', 'discovery']).toContain(signal.category)
    }
  })

  it('signal keys are unique', () => {
    const keys = SIGNAL_KEYS
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('has a valid version string', () => {
    expect(SIGNAL_REGISTRY.version).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
