import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const workspaceRoot = process.cwd()

const collectSourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'tests') {
          return []
        }

        return collectSourceFiles(fullPath)
      }

      return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : []
    }),
  )

  return files.flat()
}

test('only the shared WhatsApp sender source can reach the Meta Graph API /messages endpoint', async () => {
  const sourceFiles = await collectSourceFiles(workspaceRoot)
  const matches: string[] = []

  for (const filePath of sourceFiles) {
    const source = await fs.readFile(filePath, 'utf8')
    if (source.includes('https://graph.facebook.com/') && source.includes('/messages')) {
      matches.push(path.relative(workspaceRoot, filePath).replace(/\\/g, '/'))
    }
  }

  assert.deepEqual(matches, ['lib/labour-whatsapp.ts'])
})

test('automatic and retry notification wrappers stay on the shared sender path', async () => {
  const workerAppPath = path.join(workspaceRoot, 'lib', 'labour-worker-app.ts')
  const source = await fs.readFile(workerAppPath, 'utf8')

  assert.ok(source.includes("sendWhatsappTemplateMessage"))
  assert.ok(source.includes("sendWhatsappTextMessage"))
  assert.equal(source.includes('https://graph.facebook.com/'), false)
  assert.equal(source.includes('/messages'), false)
})

test('admin WhatsApp source contains no manual bulk or test-send bypass path', async () => {
  const adminWhatsappFiles = await collectSourceFiles(path.join(workspaceRoot, 'app', 'api', 'admin'))
  const labourAdminPagePath = path.join(workspaceRoot, 'app', 'admin', 'labour', 'page.tsx')
  const labourAdminSource = await fs.readFile(labourAdminPagePath, 'utf8')

  for (const filePath of adminWhatsappFiles) {
    const source = await fs.readFile(filePath, 'utf8')
    assert.equal(source.includes('https://graph.facebook.com/'), false)
    assert.equal(source.includes('/messages'), false)
  }

  assert.equal(labourAdminSource.includes('Send Test Message'), false)
  assert.equal(labourAdminSource.includes('/api/admin/labour/whatsapp/bulk'), false)
  assert.equal(labourAdminSource.includes('/api/admin/labour/whatsapp/test'), false)
})
