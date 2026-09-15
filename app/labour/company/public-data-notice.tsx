import Link from 'next/link'

type Props = {
  retryHref: string
  message?: string
}
export function PublicDataNotice({
  retryHref,
  message = 'Some live information is temporarily unavailable. The rest of this page is still available.',
}: Props) {
  return (
    <section
      role="status"
      aria-live="polite"
      style={{
        margin: '16px auto',
        width: 'min(1120px, calc(100% - 32px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        border: '1px solid #fed7aa',
        borderRadius: '14px',
        background: '#fff7ed',
        color: '#9a3412',
        padding: '12px 14px',
        fontSize: '13px',
        lineHeight: 1.5,
      }}
    >
      <span>{message}</span>
      <Link
        href={retryHref}
        prefetch={false}
        style={{
          minHeight: '40px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #fdba74',
          borderRadius: '10px',
          background: '#ffffff',
          color: '#9a3412',
          padding: '8px 13px',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        Retry
      </Link>
    </section>
  )
}
