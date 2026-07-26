import registry from '@/data/evidence-atoms.generated.json'

type Surface = {
  route: string
  slot: string
}

type PublicClaim = {
  claimId: string
  text: string
  evidenceIds: string[]
  supportStatus: string
}

export function getPublicClaim(claimId: string, surface: Surface): PublicClaim | null {
  const atom = registry.entries.find(
    (entry) =>
      entry.claimId === claimId &&
      entry.route === surface.route &&
      entry.slot === surface.slot &&
      entry.projectionType === 'visible_text',
  )

  if (!atom) return null
  return {
    claimId: atom.claimId,
    text: atom.text,
    evidenceIds: atom.evidenceIds,
    supportStatus: atom.supportStatus,
  }
}
