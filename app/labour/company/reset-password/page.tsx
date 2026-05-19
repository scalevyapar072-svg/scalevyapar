import ResetPasswordForm from '@/app/reset-password/reset-password-form'

export default async function CompanyResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams

  return (
    <ResetPasswordForm
      token={params.token || ''}
      backHref="/labour/company/signin"
      backLabel="Back to company sign in"
      successRedirectHref="/labour/company/signin"
    />
  )
}
