import { getMainWebsiteContent } from '@/lib/main-website-content'
import LoginPageClient from './login-page-client'

export default async function LoginPage() {
  const { content } = await getMainWebsiteContent()
  return <LoginPageClient content={content} />
}
