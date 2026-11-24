/**
 * Submission policy: blocked contributors are refused unread by the workflow.
 *
 * The tests pin the repository's own policy data and the checker exit codes
 * (3 = blocked, 2 = usage or broken policy) so a crashed checker (exit 1) can
 * never be mistaken for a blocked contributor.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  BLOCKED_EXIT_CODE,
  POLICY_VERSION,
  findBlockedContributor,
  loadPolicy,
} from './submission-policy.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPT = join(ROOT, 'scripts', 'submission-policy.mjs')

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8' })
}

test('the repository policy is well-formed and blocks PerryLink', () => {
  const policy = loadPolicy()
  assert.equal(policy.version, POLICY_VERSION)
  const blocked = findBlockedContributor(policy, 'PerryLink')
  assert.ok(blocked, 'PerryLink must be a blocked contributor')
  assert.equal(blocked.blockedAt, '2026-11-24')
})

test('the blocked-contributor match ignores case and surrounding space', () => {
  const policy = loadPolicy()
  for (const login of ['perrylink', 'PERRYLINK', ' PerryLink ']) {
    assert.ok(findBlockedContributor(policy, login), login + ' must match')
  }
  assert.equal(findBlockedContributor(policy, 'PerryLink2'), null)
  assert.equal(findBlockedContributor(policy, 'Perry'), null)
})

test('an unlisted contributor is allowed with exit code 0', () => {
  assert.equal(findBlockedContributor(loadPolicy(), 'zhu1090093659'), null)
  const result = run(['--login', 'zhu1090093659'])
  assert.equal(result.status, 0)
})

test('the CLI reports a blocked contributor with the blocked exit code', () => {
  const result = run(['--login', 'PerryLink'])
  assert.equal(result.status, BLOCKED_EXIT_CODE)
  assert.match(result.stdout, /blocked contributor PerryLink/)
})

test('a crashed checker can never read as a blocked contributor', () => {
  const crash = spawnSync(process.execPath, [join(ROOT, 'scripts', 'missing-policy-checker.mjs')], { encoding: 'utf8' })
  assert.equal(crash.status, 1, 'the Node runtime reports a missing module as exit 1')
  assert.notEqual(crash.status, BLOCKED_EXIT_CODE)
})

test('the workflow acts on the same exit code the checker uses', () => {
  const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'submission-policy.yml'), 'utf8')
  assert.match(workflow, new RegExp('^\\s*' + BLOCKED_EXIT_CODE + '\\) .*close-reason', 'm'))
})

test('a usage error exits 2, never 1', () => {
  assert.equal(run([]).status, 2)
  assert.equal(run(['--login']).status, 2)
})

test('a malformed policy is an error, not a blocked contributor', () => {
  const sandbox = mkdtempSync(join(tmpdir(), 'submission-policy-'))
  try {
    const file = join(sandbox, 'policy.json')
    writeFileSync(file, JSON.stringify({
      version: POLICY_VERSION,
      blockedContributors: [{ login: 'someone' }],
    }))
    assert.throws(() => loadPolicy(file), /blockedAt/)
    writeFileSync(file, JSON.stringify({ version: 99, blockedContributors: [] }))
    assert.throws(() => loadPolicy(file), /unsupported version/)
    writeFileSync(file, JSON.stringify({
      version: POLICY_VERSION,
      blockedContributors: [{ login: 'A', blockedAt: '2026-11-24', reason: 'x' }, { login: 'a', blockedAt: '2026-11-24', reason: 'x' }],
    }))
    assert.throws(() => loadPolicy(file), /duplicate blocked login/)
  } finally {
    rmSync(sandbox, { recursive: true, force: true })
  }
})
