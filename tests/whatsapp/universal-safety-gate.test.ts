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
        if (
          entry.name === 'node_modules' ||
          entry.name === '.next' ||
          entry.name === 'tests' ||
          entry.name === '.codex-temp'
        ) {
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

test('worker application source contains no legacy WhatsApp application-confirmation wrappers or direct sender bypass', async () => {
  const workerAppPath = path.join(workspaceRoot, 'lib', 'labour-worker-app.ts')
  const source = await fs.readFile(workerAppPath, 'utf8')

  assert.equal(source.includes('sendWorkerApplicationConfirmationWhatsapp'), false)
  assert.equal(source.includes('sendCompanyApplicationWhatsapp'), false)
  assert.equal(source.includes('WHATSAPP_WORKER_CONFIRMATION_TEMPLATE_NAME'), false)
  assert.equal(source.includes('WHATSAPP_COMPANY_APPLICATION_TEMPLATE_NAME'), false)
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
