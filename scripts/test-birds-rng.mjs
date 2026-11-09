#!/usr/bin/env node
/**
 * Known-answer test for the seeded bird RNG.
 *
 * `?birds-seed=N` promises a reproducible draw sequence, so the xorshift32
 * stream must not drift silently. The expected values are six-decimal draws
 * from makeSeededRng(seed); regenerate them only when the algorithm is
 * intentionally changed, and expect seeded runs to change with it.
 */
import assert from 'node:assert/strict'
import { makeSeededRng } from '../src/components/BirdPets/birdRandom.js'

const VECTORS = [
  ['seed 1', 1, ['0.000063', '0.015747', '0.616404', '0.071619']],
  ['seed 42', 42, ['0.002644', '0.660312', '0.110957']],
  ['seed 4227866623', 4227866623, ['0.000237', '0.945083', '0.200708', '0.102051']],
  ['seed 0', 0, ['0.316594', '0.875707', '0.483300', '0.005915']],
]

let failed = 0
for (const [label, seed, expected] of VECTORS) {
  const rng = makeSeededRng(seed)
  const actual = expected.map(() => rng().toFixed(6))
  try {
    assert.deepEqual(actual, expected, `${label} draw sequence`)
    console.log(`ok - ${label}`)
  } catch {
    failed += 1
    console.error(`not ok - ${label}`)
    console.error(`  expected: ${expected.join(', ')}`)
    console.error(`  actual:   ${actual.join(', ')}`)
  }
}

if (failed) {
  console.error(`\n${failed} of ${VECTORS.length} known-answer vectors failed`)
  process.exitCode = 1
} else {
  console.log(`\n${VECTORS.length} known-answer vectors passed`)
}
