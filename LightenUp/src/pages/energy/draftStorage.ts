export const ENERGY_DRAFT_STORAGE_KEY = 'energy-publish-draft'

export interface DraftFile {
  type: 'image' | 'video'
  url: string
}

export interface EnergyPublishDraft {
  content: string
  files: DraftFile[]
  selectedTypeId: number | null
  selectedStickerId: number | null
  mood: {
    name: string
    colorHex: string
    iconCode: string
    stickerUrl: string
  } | null
  savedAt: string
}

export const isRestorableDraftFile = (file: DraftFile) => !file.url.startsWith('blob:')

export const readEnergyPublishDraft = (): EnergyPublishDraft | null => {
  const rawDraft = localStorage.getItem(ENERGY_DRAFT_STORAGE_KEY)
  if (!rawDraft) return null

  try {
    const draft: EnergyPublishDraft = JSON.parse(rawDraft)
    const selectedTypeId = draft.selectedTypeId ?? null
    const selectedStickerId = draft.selectedStickerId ?? (selectedTypeId !== null ? 0 : null)

    return {
      ...draft,
      content: draft.content || '',
      files: (draft.files || []).filter(isRestorableDraftFile),
      selectedTypeId,
      selectedStickerId,
      mood: draft.mood || null,
      savedAt: draft.savedAt || '',
    }
  } catch (error) {
    console.error('读取草稿失败', error)
    localStorage.removeItem(ENERGY_DRAFT_STORAGE_KEY)
    return null
  }
}

export const saveEnergyPublishDraft = (draft: EnergyPublishDraft) => {
  localStorage.setItem(ENERGY_DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

export const clearEnergyPublishDraft = () => {
  localStorage.removeItem(ENERGY_DRAFT_STORAGE_KEY)
}
