// Browser-side campaign helpers, kept free of the campaign configs so they add almost nothing to the bundle.

export const GENERAL = 'general'

/** The campaign chosen for this visit by the home page (see AboutContent.astro), or general. */
export function currentCampaign(): string {
  try {
    return sessionStorage.getItem('campaign') ?? GENERAL
  } catch {
    return GENERAL
  }
}

/** Swap campaign templates into their slots inside `root` (used for content the desktop fetches or adopts). */
export function applyCampaign(root: ParentNode, id: string = currentCampaign()): void {
  if (id === GENERAL) return
  root.querySelectorAll<HTMLTemplateElement>(`template[data-campaign="${CSS.escape(id)}"]`).forEach((t) => {
    const slot = root.querySelector(`[data-campaign-slot="${CSS.escape(t.dataset.slot ?? '')}"]`)
    slot?.replaceChildren(t.content.cloneNode(true))
  })
}
