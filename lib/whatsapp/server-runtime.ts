export const assertWhatsappServerOnly = (moduleName: string) => {
  if (typeof window !== 'undefined') {
    throw new Error(`${moduleName} is server-only and must not be imported into client bundles.`)
  }
}
