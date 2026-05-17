import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MainWebsiteHome from '@/components/main-website/MainWebsiteHome'
import { buildMainWebsiteMetadata, getSafeMainWebsiteContent } from '@/lib/main-website-content'

export async function generateMetadata(): Promise<Metadata> {
  return buildMainWebsiteMetadata('home')
}

export default async function HomePage() {
  const { content } = await getSafeMainWebsiteContent()

  return (
    <>
      <Navbar content={content} />
      <MainWebsiteHome content={content} />
      <Footer content={content} />
    </>
  )
}
