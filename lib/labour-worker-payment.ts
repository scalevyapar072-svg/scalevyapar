import { createLabourEntity, getLabourMarketplaceSnapshot, updateLabourEntity } from './labour-marketplace'
import { getWorkerAppDashboard } from './labour-worker-app'

const buildRazorpayTransactionId = (paymentId: string) =>
  `txn-worker-razorpay-${paymentId.replace(/[^a-z0-9_-]+/gi, '').slice(0, 60)}`

export const creditWorkerWalletFromRazorpay = async ({
  workerId,
  amount,
  razorpayOrderId,
  razorpayPaymentId
}: {
  workerId: string
  amount: number
  razorpayOrderId: string
  razorpayPaymentId: string
}) => {
  const rechargeAmount = Math.max(0, Math.round(Number(amount || 0)))
  if (rechargeAmount <= 0) {
    throw new Error('Recharge amount is invalid.')
  }

  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = snapshot.workers.find(item => item.id === workerId)
  if (!worker) {
    throw new Error('Worker account not found for this payment.')
  }

  const transactionId = buildRazorpayTransactionId(razorpayPaymentId)
  const existingTransaction = snapshot.walletTransactions.find(transaction =>
    transaction.id === transactionId ||
    (
      transaction.entityType === 'worker' &&
      transaction.entityId === workerId &&
      transaction.transactionType === 'wallet_recharge' &&
      transaction.note.includes(razorpayPaymentId)
    )
  )

  if (!existingTransaction) {
    const now = new Date().toISOString()
    await createLabourEntity('walletTransactions', {
      id: transactionId,
      entityType: 'worker',
      entityId: worker.id,
      entityName: worker.fullName || worker.mobile,
      city: worker.city,
      transactionType: 'wallet_recharge',
      amount: rechargeAmount,
      direction: 'credit',
      status: 'completed',
      reference: razorpayOrderId,
      note: `Razorpay wallet recharge ${razorpayPaymentId}. Order ${razorpayOrderId}.`,
      createdAt: now,
      updatedAt: now
    }, 'worker-razorpay-payment')

    await updateLabourEntity('workers', worker.id, {
      walletBalance: worker.walletBalance + rechargeAmount
    }, 'worker-razorpay-payment')
  }

  return getWorkerAppDashboard(worker.id)
}
