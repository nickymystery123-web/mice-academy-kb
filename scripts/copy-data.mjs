import { cpSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = resolve(__dirname, '../data')
const dest = resolve(__dirname, '../frontend/data')

if (existsSync(src)) {
  cpSync(src, dest, { recursive: true })
  console.log('[copy-data] Copied data/ -> frontend/data/')
} else {
  console.log('[copy-data] WARNING: data/ not found at', src)
}