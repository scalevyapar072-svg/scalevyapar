export type CompanyIdentityVerificationState =
  | 'not_submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'

type CompanyIdentityVerificationInput = {
  identityProofPath?: unknown
  kycStatus?: unknown
}

const normalizeKycStatus = (value: unknown) =>
  String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

export const getCompanyIdentityVerificationState = ({
  identityProofPath,
  kycStatus,
}: CompanyIdentityVerificationInput): CompanyIdentityVerificationState => {
  const normalizedKycStatus = normalizeKycStatus(kycStatus)

  if (normalizedKycStatus === 'approved') return 'approved'
  if (
    normalizedKycStatus === 'rejected' ||
    normalizedKycStatus === 'needs_correction' ||
    normalizedKycStatus === 'need_correction'
  ) {
    return 'rejected'
  }

  return String(identityProofPath || '').trim() ? 'in_review' : 'not_submitted'
}
