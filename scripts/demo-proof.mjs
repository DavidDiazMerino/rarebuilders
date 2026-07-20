import { spawn } from 'node:child_process'
import process from 'node:process'

const colors = {
  amber: '\u001b[38;5;214m',
  cyan: '\u001b[38;5;81m',
  dim: '\u001b[2m',
  green: '\u001b[38;5;114m',
  red: '\u001b[38;5;203m',
  reset: '\u001b[0m',
  white: '\u001b[97m',
}

const useColor = process.stdout.isTTY && !process.env.NO_COLOR
const paint = (color, value) => useColor ? `${colors[color]}${value}${colors.reset}` : value

function runCheck(label, command, args) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now()
    const env = { ...process.env, NO_COLOR: '1' }
    delete env.FORCE_COLOR

    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })

    const frames = ['·', '··', '···']
    let frame = 0
    const render = () => {
      if (process.stdout.isTTY) {
        process.stdout.write(`\r\u001b[2K${paint('amber', frames[frame % frames.length].padEnd(3))} ${label}`)
      }
      frame += 1
    }

    if (!process.stdout.isTTY) process.stdout.write(`Running ${label}... `)
    render()
    const animation = setInterval(render, 280)

    child.on('error', (error) => {
      clearInterval(animation)
      reject(error)
    })

    child.on('close', (code) => {
      clearInterval(animation)
      const duration = (performance.now() - startedAt) / 1000

      if (code !== 0) {
        if (process.stdout.isTTY) process.stdout.write('\r\u001b[2K')
        console.error(`${paint('red', '✗')} ${label}`)
        console.error(output.trim())
        reject(new Error(`${label} failed with exit code ${code}`))
        return
      }

      if (process.stdout.isTTY) process.stdout.write('\r\u001b[2K')
      console.log(`${paint('green', '✓')} ${label} ${paint('dim', `${duration.toFixed(1)}s`)}`)
      resolve({ duration, output })
    })
  })
}

function count(output, expression, fallback) {
  const match = output.match(expression)
  return match?.[1] ?? fallback
}

async function main() {
  console.log(`\n${paint('white', 'RAREBUILDERS')} ${paint('dim', '/ live engineering verification')}\n`)

  const build = await runCheck('TypeScript production build', 'npm', ['run', 'build'])
  const unit = await runCheck('Unit and integration suite', 'npx', ['vitest', 'run', '--reporter=dot'])
  const browser = await runCheck('End-to-end Chromium journeys', 'npx', ['playwright', 'test', '--reporter=line'])

  const unitTests = count(unit.output, /Tests\s+(\d+) passed/, 'all')
  const browserTests = count(browser.output, /(\d+) passed/, 'all')
  const totalDuration = build.duration + unit.duration + browser.duration

  console.log(`\n${paint('green', 'ALL CHECKS PASSED')} ${paint('dim', `· verified from source in ${totalDuration.toFixed(1)}s`)}`)
  console.log(`${paint('green', '✓')} ${unitTests} unit and integration tests`)
  console.log(`${paint('green', '✓')} ${browserTests} end-to-end browser journeys`)
  console.log(`${paint('green', '✓')} production build and typed contracts\n`)

  console.log(paint('white', 'HOW RAREBUILDERS MAKES A DECISION'))
  console.log(paint('dim', '────────────────────────────────────────────────────────────────────'))
  console.log(`  ${paint('cyan', 'PUBLIC URL · CV · GITHUB · CURATED CONNECTORS')}`)
  console.log('                           │')
  console.log('                 Safe source adapters')
  console.log('                           │')
  console.log(`              ${paint('amber', 'GPT-5.6 language understanding')}`)
  console.log('          facts · evidence · unknowns · strategy')
  console.log('                           │')
  console.log('        Zod validation + deterministic TypeScript')
  console.log('             scoring · ranking · safeguards')
  console.log('                           │')
  console.log(`          ${paint('cyan', 'FIVE-CHOICE RADAR → EXPLAINABLE DOSSIER')}`)
  console.log('                           │')
  console.log('              reasoned feedback ↺ undoable')
  console.log(paint('dim', '────────────────────────────────────────────────────────────────────'))
  console.log(`${paint('white', 'CODEX')} ${paint('dim', 'primary engineering collaborator across workflows, adapters, tests and deployment')}\n`)
}

main().catch(() => {
  process.exitCode = 1
})
