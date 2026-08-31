#!/usr/bin/env node
/**
 * Rewrite the `tags:` front matter of translated posts using the shared
 * glossary, so every locale uses one fixed translation per tag.
 *
 * Tags are deliberately NOT translated by the translation agents: tags drive
 * the related-posts matching, so a tag rendered two different ways inside one
 * language would silently split the graph and break "Keep reading".
 *
 * Usage: node scripts/apply-tag-glossary.mjs [--check]
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.cwd(), 'content/blog')
const glossary = JSON.parse(fs.readFileSync(path.join(ROOT, 'tag-glossary.json'), 'utf-8'))
const LANGS = ['ko', 'ja']
const check = process.argv.includes('--check')

let changed = 0
let missing = new Set()

for (const lang of LANGS) {
  const dir = path.join(ROOT, lang)
  if (!fs.existsSync(dir)) continue

  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const full = path.join(dir, file)
    const raw = fs.readFileSync(full, 'utf-8')
    const m = raw.match(/^(---\n[\s\S]*?\n)(tags:\s*\[)(.*?)(\]\n)/)
    if (!m) {
      console.warn(`  ! no tags line: ${lang}/${file}`)
      continue
    }

    const tags = [...m[3].matchAll(/"([^"]+)"/g)].map(x => x[1])
    const mapped = tags.map(t => {
      const entry = glossary[t]
      if (!entry || !entry[lang]) {
        // Already translated on a previous run, or genuinely unknown.
        if (!Object.values(glossary).some(v => v[lang] === t)) missing.add(`${lang}: ${t}`)
        return t
      }
      return entry[lang]
    })

    // Several English tags collapse onto one translation (saju / four pillars
    // / four pillars of destiny all become 四柱推命), so dedupe or the chip
    // list renders the same word twice and React sees duplicate keys.
    const translated = [...new Set(mapped)]

    if (JSON.stringify(tags) === JSON.stringify(translated)) continue

    const line = translated.map(t => `"${t}"`).join(', ')
    const out = raw.replace(m[0], `${m[1]}${m[2]}${line}${m[4]}`)
    if (!check) fs.writeFileSync(full, out)
    changed++
    console.log(`  ${check ? 'would update' : 'updated'} ${lang}/${file}`)
  }
}

if (missing.size) {
  console.log('\n  tags with no glossary entry (left as-is):')
  for (const t of [...missing].sort()) console.log(`    ${t}`)
}
console.log(`\n${check ? 'would change' : 'changed'} ${changed} file(s)`)
