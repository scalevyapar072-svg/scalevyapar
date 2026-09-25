import type { WhatsappInboundMessageEvent } from './inbound-message'
import { assertWhatsappServerOnly } from './server-runtime'

assertWhatsappServerOnly('lib/whatsapp/inbound-command-processor')

type AtomicInboundCommandRow = {
  processed?: boolean
  duplicate?: boolean
}

export type WhatsappAtomicInboundCommandResult = {
  processed: boolean
  duplicate: boolean
}

export type WhatsappAtomicInboundCommandRpcClient = {
  rpc: (
    functionName: string,
    parameters: Record<string, unknown>,
  ) => {
    single: () => Promise<{
      data: AtomicInboundCommandRow | null
      error: unknown
    }>
  }
}

const normalizeTimestamp = (value: string) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return null

  if (/^\d{10,13}$/.test(trimmed)) {
    const numeric = Number(trimmed)
    if (Number.isFinite(numeric)) {
      const parsed = new Date(trimmed.length === 13 ? numeric : numeric * 1000)
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
    }
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export const createWhatsappAtomicInboundCommandProcessor = ({
  client,
}: {
  client: WhatsappAtomicInboundCommandRpcClient
}) => async (
  event: WhatsappInboundMessageEvent,
): Promise<WhatsappAtomicInboundCommandResult> => {
  if (!event.normalizedMobile || event.classification.kind === 'none') {
    return { processed: false, duplicate: false }
  }

  const { data, error } = await client
    .rpc('process_labour_whatsapp_inbound_command', {
      p_message_id: event.messageId,
      p_normalized_mobile: event.normalizedMobile,
      p_raw_text: event.rawText,
      p_normalized_text: event.normalizedText,
      p_command_kind: event.classification.kind,
      p_command_key: event.classification.normalizedCommand,
      p_received_at: normalizeTimestamp(event.timestamp),
    })
    .single()

  if (error || !data || typeof data.processed !== 'boolean' || typeof data.duplicate !== 'boolean') {
    throw new Error('Unable to process WhatsApp inbound command atomically.')
  }

  return {
    processed: data.processed,
    duplicate: data.duplicate,
  }
}
