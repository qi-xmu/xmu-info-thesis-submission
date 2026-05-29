import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = resolve(__dirname, '../../data/tracker.json')
const destDir = resolve(__dirname, '../public')
const dest = resolve(destDir, 'tracker.json')

if (!existsSync(src)) {
  console.error('tracker.json not found at', src)
  process.exit(1)
}

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true })
}

copyFileSync(src, dest)
console.log('Copied tracker.json to public/')
