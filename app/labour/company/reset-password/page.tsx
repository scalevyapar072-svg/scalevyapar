import ResetPasswordForm from '@/app/reset-password/reset-password-form'
import { headers } from 'next/headers'
import { toRozgarPublicPath } from '@/lib/labour-company-host'

export default async function CompanyResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const headerStore = await headers()
  const hostname = headerStore.get('host')?.split(':')[0] ?? null

  return (
    <ResetPasswordForm
      token={params.token || ''}
      backHref={toRozgarPublicPath('/labour/company/signin', hostname)}
      backLabel="Back to company sign in"
      successRedirectHref={toRozgarPublicPath('/labour/company/signin', hostname)}
    />
  )
}
