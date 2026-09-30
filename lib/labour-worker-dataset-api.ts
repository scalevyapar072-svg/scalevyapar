type WorkerDatasetApiDependencies<T> = {
  authorize: (request: Request) => Promise<{ email: string } | Response>
  loadWorkers: () => Promise<T[]>
}

export const createAdminWorkerDatasetGetHandler = <T>(dependencies: WorkerDatasetApiDependencies<T>) =>
  async (request: Request) => {
    const authorization = await dependencies.authorize(request)
    if (authorization instanceof Response) return authorization

    try {
      const workers = await dependencies.loadWorkers()
      return Response.json({ workers, count: workers.length })
    } catch (error) {
      console.error('Admin worker dataset fetch failed:', error)
      return Response.json({ error: 'Unable to load the complete worker dataset.' }, { status: 500 })
    }
  }
