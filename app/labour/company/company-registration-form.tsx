'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import styles from './company-site.module.css'
import {
  LabourIndustryBusinessDependency,
  LabourMasterOption,
  buildLabourMasterSelectOptions,
  filterBusinessTypesByIndustryDependency,
  getVisibleLabourMasterOptions
} from '@/lib/labour-masters-schema'

type CategoryOption = {
  id: string
  name: string
  description: string
  demandLevel: 'high' | 'medium' | 'low'
}

type PlanOption = {
  id: string
  name: string
  planAmount: number
  registrationFee: number
  validityDays: number
  description: string
  categoryId?: string
}

type Props = {
  categories: CategoryOption[]
  plans: PlanOption[]
  cityOptions: string[]
  industryCategoryOptions: LabourMasterOption[]
  businessTypeOptions: LabourMasterOption[]
  industryBusinessDependencies: LabourIndustryBusinessDependency[]
  accentColor?: string
}

type UploadKey = 'gstCertificate' | 'companyProof' | 'ownerIdProof'

type FormState = {
  companyName: string
  contactPerson: string
  businessType: string
  industryCategory: string
  gstNumber: string
  companyEmail: string
  mobile: string
  whatsAppNumber: string
  companyAddress: string
  state: string
  city: string
  area: string
  pincode: string
  password: string
  confirmPassword: string
}

type UploadState = {
  file: File | null
  progress: number
  status: 'idle' | 'ready' | 'uploading' | 'uploaded' | 'error'
  error: string
  storagePath: string
  fileName: string
}

const REGISTRATION_BENEFITS = [
  'Register your company once and keep your hiring details connected with the ScaleVyapar worker admin workflow.',
  'Keep company profile, location, and business identity ready for faster approval and onboarding.',
  'Submit business details clearly so your company can be reviewed and activated without repeated follow-up.',
  'Use one company profile for requirement posting, worker discovery, and company-panel activity tracking.'
]

const FAST_HIRING_STEPS = [
  'Fill the company details with contact person, business type, city, and area so onboarding reaches the right admin flow.',
  'After submission, your registration reaches the ScaleVyapar worker admin companies list for review.',
  'Once approved, you can post requirements, receive worker responses, and manage hiring from the company panel.',
  'A complete location and business profile helps ScaleVyapar connect your company with the right worker requirements faster.'
]

const initialFormState: FormState = {
  companyName: '',
  contactPerson: '',
  businessType: '',
  industryCategory: '',
  gstNumber: '',
  companyEmail: '',
  mobile: '',
  whatsAppNumber: '',
  companyAddress: '',
  state: '',
  city: '',
  area: '',
  pincode: '',
  password: '',
  confirmPassword: ''
}

const emptyUploadState = (): UploadState => ({
  file: null,
  progress: 0,
  status: 'idle',
  error: '',
  storagePath: '',
  fileName: ''
})

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function CompanyRegistrationForm({
  cityOptions,
  industryCategoryOptions,
  businessTypeOptions,
  industryBusinessDependencies,
  accentColor = '#1d4ed8'
}: Props) {
  const [form, setForm] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | UploadKey | 'submit', string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [submissionId, setSubmissionId] = useState(() => `company-intake-${Date.now()}`)
  const [uploads, setUploads] = useState<Record<UploadKey, UploadState>>({
    gstCertificate: emptyUploadState(),
    companyProof: emptyUploadState(),
    ownerIdProof: emptyUploadState()
  })

  const availableCities = cityOptions.reduce<string[]>((list, city) => {
    const normalized = city.trim()
    if (!normalized) return list
    if (list.some(item => item.toLowerCase() === normalized.toLowerCase())) return list
    return [...list, normalized]
  }, [])

  const visibleIndustryCategoryOptions = useMemo(
    () => buildLabourMasterSelectOptions(getVisibleLabourMasterOptions(industryCategoryOptions)),
    [industryCategoryOptions]
  )

  const visibleBusinessTypeOptions = useMemo(
    () =>
      buildLabourMasterSelectOptions(
        filterBusinessTypesByIndustryDependency(
          businessTypeOptions,
          industryCategoryOptions,
          industryBusinessDependencies,
          form.industryCategory
        )
      ),
    [businessTypeOptions, form.industryCategory, industryBusinessDependencies, industryCategoryOptions]
  )

  useEffect(() => {
    if (!form.industryCategory) return
    if (visibleIndustryCategoryOptions.some(option => option.value === form.industryCategory)) return

    setForm(current => ({
      ...current,
      industryCategory: '',
      businessType: ''
    }))
    setErrors(current => ({ ...current, industryCategory: '', businessType: '', submit: '' }))
  }, [form.industryCategory, visibleIndustryCategoryOptions])

  useEffect(() => {
    if (!form.industryCategory) {
      if (!form.businessType) return
      setForm(current => ({ ...current, businessType: '' }))
      setErrors(current => ({ ...current, businessType: '', submit: '' }))
      return
    }

    if (!form.businessType) return
    if (visibleBusinessTypeOptions.some(option => option.value === form.businessType)) return

    setForm(current => ({ ...current, businessType: '' }))
    setErrors(current => ({ ...current, businessType: '', submit: '' }))
  }, [form.businessType, form.industryCategory, visibleBusinessTypeOptions])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: '', submit: '' }))
  }

  const setUploadState = (key: UploadKey, next: Partial<UploadState>) => {
    setUploads(current => ({
      ...current,
      [key]: {
        ...current[key],
        ...next
      }
    }))
    setErrors(current => ({ ...current, [key]: '', submit: '' }))
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState | UploadKey | 'submit', string>> = {}

    if (!form.companyName.trim()) nextErrors.companyName = 'Company name is required.'
    if (!form.contactPerson.trim()) nextErrors.contactPerson = 'Owner or contact person name is required.'
    if (!form.businessType) nextErrors.businessType = 'Select a business type.'
    if (!form.industryCategory) nextErrors.industryCategory = 'Select an industry category.'
    if (form.gstNumber.trim() && !GST_REGEX.test(form.gstNumber.trim().toUpperCase())) nextErrors.gstNumber = 'GST number format is not valid.'

    if (!form.companyEmail.trim()) nextErrors.companyEmail = 'Company email is required.'
    else if (!EMAIL_REGEX.test(form.companyEmail.trim())) nextErrors.companyEmail = 'Enter a valid company email.'

    if (!/^\d{10}$/.test(form.mobile.trim())) nextErrors.mobile = 'Mobile number must be exactly 10 digits.'
    if (!/^\d{10}$/.test(form.whatsAppNumber.trim())) nextErrors.whatsAppNumber = 'WhatsApp number must be exactly 10 digits.'
    if (!form.companyAddress.trim()) nextErrors.companyAddress = 'Company address is required.'
    if (!form.state.trim()) nextErrors.state = 'State is required.'
    if (!form.city.trim()) nextErrors.city = 'City is required.'
    if (!form.area.trim()) nextErrors.area = 'Area is required.'
    if (!/^\d{6}$/.test(form.pincode.trim())) nextErrors.pincode = 'Pincode must be exactly 6 digits.'
    if (!form.password) nextErrors.password = 'Create password is required.'
    else if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      nextErrors.password = 'Password must be at least 8 characters and include letters and numbers.'
    }
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm password is required.'
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.'

    setErrors(nextErrors)
    return nextErrors
  }

  const isValid =
    Boolean(form.companyName.trim()) &&
    Boolean(form.contactPerson.trim()) &&
    Boolean(form.businessType) &&
    Boolean(form.industryCategory) &&
    (!form.gstNumber.trim() || GST_REGEX.test(form.gstNumber.trim().toUpperCase())) &&
    EMAIL_REGEX.test(form.companyEmail.trim()) &&
    /^\d{10}$/.test(form.mobile.trim()) &&
    /^\d{10}$/.test(form.whatsAppNumber.trim()) &&
    Boolean(form.companyAddress.trim()) &&
    Boolean(form.state.trim()) &&
    Boolean(form.city.trim()) &&
    Boolean(form.area.trim()) &&
    /^\d{6}$/.test(form.pincode.trim()) &&
    form.password.length >= 8 &&
    /[A-Za-z]/.test(form.password) &&
    /\d/.test(form.password) &&
    form.confirmPassword === form.password

  const handleFileChange = (key: UploadKey, file: File | null) => {
    if (!file) {
      setUploadState(key, emptyUploadState())
      return
    }

    setUploadState(key, {
      file,
      progress: 6,
      status: 'ready',
      error: '',
      storagePath: '',
      fileName: file.name
    })
  }

  const uploadDocumentIfPresent = async (key: UploadKey, documentKind: string) => {
    const current = uploads[key]
    if (!current.file) {
      return null
    }

    return uploadDocument(key, documentKind)
  }

  const uploadDocument = async (key: UploadKey, documentKind: string) => {
    const current = uploads[key]
    if (!current.file) {
      throw new Error('Required upload file is missing.')
    }

    setUploadState(key, { status: 'uploading', progress: 18, error: '' })

    const formData = new FormData()
    formData.append('submissionId', submissionId)
    formData.append('documentKind', documentKind)
    formData.append('file', current.file)

    const progressSteps = [38, 62, 84]
    let stepIndex = 0
    const timer = window.setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setUploadState(key, { progress: progressSteps[stepIndex] })
        stepIndex += 1
      }
    }, 180)

    try {
      const response = await fetch('/api/labour/company/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json().catch(() => ({ error: 'Unexpected upload response.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload company document.')
      }

      setUploadState(key, {
        progress: 100,
        status: 'uploaded',
        storagePath: String(data.storagePath || ''),
        fileName: String(data.fileName || current.file.name)
      })

      return {
        fileName: String(data.fileName || current.file.name),
        storagePath: String(data.storagePath || ''),
        bucket: String(data.bucket || '')
      }
    } catch (error) {
      setUploadState(key, {
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to upload file.'
      })
      throw error
    } finally {
      window.clearInterval(timer)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccess('')

    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      const uploadedDocuments = await Promise.all([
        uploadDocumentIfPresent('gstCertificate', 'gst_certificate'),
        uploadDocumentIfPresent('companyProof', 'company_proof'),
        uploadDocumentIfPresent('ownerIdProof', 'owner_id_proof')
      ])

      const response = await fetch('/api/labour/company-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          contactPerson: form.contactPerson.trim(),
          email: form.companyEmail.trim().toLowerCase(),
          mobile: form.mobile.trim(),
          contactMobile: form.whatsAppNumber.trim(),
          city: form.city.trim(),
          registrationMeta: {
            businessType: form.businessType,
            industryCategory: form.industryCategory,
            gstNumber: form.gstNumber.trim().toUpperCase(),
            companyEmail: form.companyEmail.trim().toLowerCase(),
            whatsAppNumber: form.whatsAppNumber.trim(),
            companyAddress: form.companyAddress.trim(),
            state: form.state.trim(),
            area: form.area.trim(),
            pincode: form.pincode.trim()
          },
          uploadedDocuments: [
            uploadedDocuments[0] ? { label: 'GST Certificate', fileName: uploadedDocuments[0].fileName, storagePath: uploadedDocuments[0].storagePath } : null,
            uploadedDocuments[1] ? { label: 'Company Proof', fileName: uploadedDocuments[1].fileName, storagePath: uploadedDocuments[1].storagePath } : null,
            uploadedDocuments[2] ? { label: 'Owner ID Proof', fileName: uploadedDocuments[2].fileName, storagePath: uploadedDocuments[2].storagePath } : null
          ].filter(Boolean)
        })
      })

      const data = await response.json().catch(() => ({ error: 'Unexpected registration response.' }))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit company registration.')
      }

      setSuccess('Your company registration has been submitted successfully. Our team will review and activate your account shortly.')
      setForm(initialFormState)
      setErrors({})
      setUploads({
        gstCertificate: emptyUploadState(),
        companyProof: emptyUploadState(),
        ownerIdProof: emptyUploadState()
      })
      setSubmissionId(`company-intake-${Date.now()}`)
    } catch (error) {
      setErrors(current => ({
        ...current,
        submit: error instanceof Error ? error.message : 'Failed to submit company registration.'
      }))
    } finally {
      setSubmitting(false)
    }
  }

  const renderUploadCard = (key: UploadKey, label: string, subtitle: string) => {
    const state = uploads[key]
    const error = errors[key]

    return (
      <label
        className={`${styles.companyRegisterUploadCard} ${error ? styles.companyRegisterUploadCardError : ''}`}
        htmlFor={key}
      >
        <input
          id={key}
          type="file"
          className={styles.companyRegisterUploadInput}
          onChange={event => handleFileChange(key, event.target.files?.[0] || null)}
          accept=".jpg,.jpeg,.png,.webp,.pdf"
        />
        <div className={styles.companyRegisterUploadIcon}>{state.file ? '✓' : '+'}</div>
        <div className={styles.companyRegisterUploadBody}>
          <p className={styles.companyRegisterUploadTitle}>{label}</p>
          <p className={styles.companyRegisterUploadText}>{state.file ? state.file.name : subtitle}</p>
          <div className={styles.companyRegisterUploadProgressTrack}>
            <span className={styles.companyRegisterUploadProgressBar} style={{ width: `${state.progress}%`, background: error ? '#ef4444' : accentColor }} />
          </div>
          <p className={styles.companyRegisterUploadMeta}>
            {state.status === 'uploaded'
              ? 'Uploaded successfully'
              : state.status === 'uploading'
                ? `Uploading ${state.progress}%`
                : state.status === 'ready'
                  ? 'Ready to upload on submit'
                  : 'Select a file to continue'}
          </p>
          {error ? <p className={styles.companyRegisterFieldError}>{error}</p> : null}
          {state.error ? <p className={styles.companyRegisterFieldError}>{state.error}</p> : null}
        </div>
      </label>
    )
  }

  const fieldClass = (name: keyof FormState) =>
    `${styles.companyRegisterInput} ${errors[name] ? styles.companyRegisterInputError : ''}`

  return (
    <section className={styles.companyRegisterShell}>
      <div className={styles.companyRegisterSplit}>
        <aside className={styles.companyRegisterAside}>
          <div className={styles.companyRegisterIllustration}>
            <div className={styles.companyRegisterIllustrationOrb} />
            <div className={styles.companyRegisterIllustrationCard}>
              <span className={styles.companyRegisterIllustrationTag}>Enterprise onboarding</span>
              <p className={styles.companyRegisterIllustrationHeadline}>Register your company and get workers faster with ScaleVyapar Rozgar</p>
              <p className={styles.companyRegisterIllustrationText}>
                ScaleVyapar Rozgar helps companies organise worker hiring in one connected flow, from company registration to requirement posting and worker response management.
              </p>
              <div className={styles.companyRegisterBenefitGrid}>
                {REGISTRATION_BENEFITS.map(item => (
                  <div key={item} className={styles.companyRegisterBenefitCard}>
                    <span className={styles.companyRegisterBenefitDot} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className={styles.companyRegisterInfoCard}>
                <p className={styles.companyRegisterInfoTitle}>How to get workers faster from ScaleVyapar</p>
                <div className={styles.companyRegisterBenefitGrid}>
                  {FAST_HIRING_STEPS.map(item => (
                    <div key={item} className={styles.companyRegisterBenefitCard}>
                      <span className={styles.companyRegisterBenefitDot} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className={styles.companyRegisterFormWrap}>
          <div className={styles.companyRegisterHeader}>
            <p className={styles.companyRegisterEyebrow}>Company registration</p>
            <p className={styles.companyRegisterSubtitle}>
              Join ScaleVyapar Rozgar and hire skilled daily-basis workers faster for your business.
            </p>
          </div>

          {success ? (
            <div className={styles.companyRegisterSuccessCard}>
              <div className={styles.companyRegisterSuccessIcon}>✓</div>
              <p className={styles.companyRegisterSuccessTitle}>Registration submitted successfully</p>
              <p className={styles.companyRegisterSuccessText}>{success}</p>
              <div className={styles.companyRegisterSuccessActions}>
                <Link href="/labour/company/panel" className={styles.companyRegisterPrimaryButton}>Open Company Panel</Link>
                <Link href="/login" className={styles.companyRegisterSecondaryButton}>Login Dashboard</Link>
              </div>
            </div>
          ) : null}

          <form className={styles.companyRegisterForm} onSubmit={handleSubmit} noValidate>
            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Company information</p>
              <div className={styles.companyRegisterGridTwo}>
                <div>
                  <label className={styles.companyRegisterLabel}>Company Name *</label>
                  <input className={fieldClass('companyName')} value={form.companyName} onChange={event => setField('companyName', event.target.value)} />
                  {errors.companyName ? <p className={styles.companyRegisterFieldError}>{errors.companyName}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Owner/Contact Person Name *</label>
                  <input className={fieldClass('contactPerson')} value={form.contactPerson} onChange={event => setField('contactPerson', event.target.value)} />
                  {errors.contactPerson ? <p className={styles.companyRegisterFieldError}>{errors.contactPerson}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Business Type *</label>
                  <select
                    className={fieldClass('businessType')}
                    value={form.businessType}
                    onChange={event => setField('businessType', event.target.value)}
                    disabled={!form.industryCategory}
                  >
                    <option value="">Select business type</option>
                    {visibleBusinessTypeOptions.map(item => <option key={item.id} value={item.value}>{item.label}</option>)}
                  </select>
                  {errors.businessType ? <p className={styles.companyRegisterFieldError}>{errors.businessType}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Industry Category *</label>
                  <select className={fieldClass('industryCategory')} value={form.industryCategory} onChange={event => setField('industryCategory', event.target.value)}>
                    <option value="">Select industry category</option>
                    {visibleIndustryCategoryOptions.map(item => <option key={item.id} value={item.value}>{item.label}</option>)}
                  </select>
                  {errors.industryCategory ? <p className={styles.companyRegisterFieldError}>{errors.industryCategory}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>GST Number</label>
                  <input className={fieldClass('gstNumber')} value={form.gstNumber} onChange={event => setField('gstNumber', event.target.value.toUpperCase())} />
                  {errors.gstNumber ? <p className={styles.companyRegisterFieldError}>{errors.gstNumber}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Company Email *</label>
                  <input className={fieldClass('companyEmail')} value={form.companyEmail} onChange={event => setField('companyEmail', event.target.value)} />
                  {errors.companyEmail ? <p className={styles.companyRegisterFieldError}>{errors.companyEmail}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Mobile Number *</label>
                  <input className={fieldClass('mobile')} value={form.mobile} maxLength={10} onChange={event => setField('mobile', event.target.value.replace(/\D/g, '').slice(0, 10))} />
                  {errors.mobile ? <p className={styles.companyRegisterFieldError}>{errors.mobile}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>WhatsApp Number *</label>
                  <input className={fieldClass('whatsAppNumber')} value={form.whatsAppNumber} maxLength={10} onChange={event => setField('whatsAppNumber', event.target.value.replace(/\D/g, '').slice(0, 10))} />
                  {errors.whatsAppNumber ? <p className={styles.companyRegisterFieldError}>{errors.whatsAppNumber}</p> : null}
                </div>
              </div>

              <div className={styles.companyRegisterGridTwo}>
                <div className={styles.companyRegisterGridWide}>
                  <label className={styles.companyRegisterLabel}>Company Address *</label>
                  <textarea className={fieldClass('companyAddress')} rows={4} value={form.companyAddress} onChange={event => setField('companyAddress', event.target.value)} />
                  {errors.companyAddress ? <p className={styles.companyRegisterFieldError}>{errors.companyAddress}</p> : null}
                </div>
                <div />
                <div>
                  <label className={styles.companyRegisterLabel}>State *</label>
                  <input className={fieldClass('state')} value={form.state} onChange={event => setField('state', event.target.value)} />
                  {errors.state ? <p className={styles.companyRegisterFieldError}>{errors.state}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>City *</label>
                  <select className={fieldClass('city')} value={form.city} onChange={event => setField('city', event.target.value)}>
                    <option value="">Select city</option>
                    {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                  {errors.city ? <p className={styles.companyRegisterFieldError}>{errors.city}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Area *</label>
                  <input className={fieldClass('area')} value={form.area} onChange={event => setField('area', event.target.value)} />
                  {errors.area ? <p className={styles.companyRegisterFieldError}>{errors.area}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Pincode *</label>
                  <input className={fieldClass('pincode')} maxLength={6} value={form.pincode} onChange={event => setField('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))} />
                  {errors.pincode ? <p className={styles.companyRegisterFieldError}>{errors.pincode}</p> : null}
                </div>
              </div>
            </div>

            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Account setup</p>
              <p className={styles.companyRegisterSectionNote}>
                Password fields are validated here for professional onboarding, while the current reviewed company access flow remains unchanged.
              </p>
              <div className={styles.companyRegisterGridTwo}>
                <div>
                  <label className={styles.companyRegisterLabel}>Create Password *</label>
                  <input type="password" className={fieldClass('password')} value={form.password} onChange={event => setField('password', event.target.value)} />
                  {errors.password ? <p className={styles.companyRegisterFieldError}>{errors.password}</p> : null}
                </div>
                <div>
                  <label className={styles.companyRegisterLabel}>Confirm Password *</label>
                  <input type="password" className={fieldClass('confirmPassword')} value={form.confirmPassword} onChange={event => setField('confirmPassword', event.target.value)} />
                  {errors.confirmPassword ? <p className={styles.companyRegisterFieldError}>{errors.confirmPassword}</p> : null}
                </div>
              </div>
            </div>

            <div className={styles.companyRegisterSection}>
              <p className={styles.companyRegisterSectionTitle}>Document uploads</p>
              <p className={styles.companyRegisterSectionNote}>Optional. You can submit the form without uploading documents.</p>
              <div className={styles.companyRegisterUploadGridCompact}>
                {renderUploadCard('gstCertificate', 'Upload GST Certificate', 'Drag and drop or click to add GST certificate')}
                {renderUploadCard('companyProof', 'Upload Company Proof', 'Upload company proof document or business certificate')}
                {renderUploadCard('ownerIdProof', 'Upload Owner ID Proof', 'Upload owner identity proof in JPG, PNG, WEBP, or PDF')}
              </div>
            </div>

            <div className={styles.companyRegisterSubmitRow}>
              <button
                type="submit"
                disabled={submitting}
                className={styles.companyRegisterPrimaryButton}
                style={{ background: submitting ? '#94a3b8' : `linear-gradient(135deg, ${accentColor}, #1d4ed8)` }}
              >
                {submitting ? 'Submitting Registration...' : 'Register Company'}
              </button>
                <p className={styles.companyRegisterSubmitNote}>
                  {isValid
                    ? 'Your company registration is ready to submit.'
                    : 'Complete the required fields below. GST number and document uploads can be left blank if not available.'}
                </p>
              {errors.submit ? <p className={styles.companyRegisterFieldError}>{errors.submit}</p> : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
