import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ContactPageClient from './contact-page-client'
import { buildMainWebsiteMetadata, getSafeMainWebsiteContent } from '@/lib/main-website-content'

export async function generateMetadata(): Promise<Metadata> {
  return buildMainWebsiteMetadata('contact')
}

export default async function ContactPage() {
  const { content } = await getSafeMainWebsiteContent()

  return (
    <>
      <Navbar content={content} />
      <ContactPageClient content={content} />
      <Footer content={content} />
    </>
  )
}
