import { requireAdmin } from '@/lib/auth'
import { handleAdminJobPostOverrideRequest } from '@/lib/admin-job-post-override'
import {
  getLabourAdminVisibleCategories,
  getLabourMarketplaceSnapshot,
  updateLabourEntity,
} from '@/lib/labour-marketplace'

const revalidatePublicLabourMarketplace = async () => {
  const { revalidateTag } = await import('next/cache')
  revalidateTag('public-labour-marketplace', 'max')
}

export async function PUT(request: Request) {
  return handleAdminJobPostOverrideRequest(request, {
    requireAdmin,
    getSnapshot: getLabourMarketplaceSnapshot,
    updateJobPost: (jobPostId, payload, actor) =>
      updateLabourEntity('jobPosts', jobPostId, payload, actor),
    getAdminCategories: getLabourAdminVisibleCategories,
    revalidatePublicCache: revalidatePublicLabourMarketplace,
  })
}
