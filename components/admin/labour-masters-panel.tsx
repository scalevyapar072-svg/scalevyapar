'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import type { LabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import type { LabourMasterGroup } from '@/lib/labour-masters-schema'
import {
  findMatchingMasterOption,
  LabourMasterDefinition,
  LabourMasterKey,
  LabourMasterOption,
  LabourMastersSnapshot,
  filterBusinessTypesByIndustryDependency,
  groupLabourMasterOptions,
  labourMasterDefinitions,
  labourMasterGroupLabels,
  labourMasterKeys,
  resolveLabourMasterLabel
} from '@/lib/labour-masters-schema'

type MasterViewGroup = LabourMasterGroup | 'categoryDependencies'

type CategoryItem = {
  id: string
  name: string
  isActive?: boolean
}

type DependencyGroupRow = {
  id: string
  industryCategoryOptionId: string
  businessTypeOptionId: string
  categoryIds: string[]
  categories: string[]
  isActive: boolean
  recordCount: number
}

type IndustryBusinessGroupRow = {
  id: string
  industryCategoryOptionId: string
  businessTypeOptionIds: string[]
  businessTypes: string[]
  isActive: boolean
  recordCount: number
}

type MappedBusinessTypeRow = {
  id: string
  industryCategoryOptionId: string
  businessTypeOptionId: string
  businessTypeLabel: string
  isActive: boolean
}

type MappedCategoryRow = {
  id: string
  industryCategoryOptionId: string
  businessTypeOptionId: string
  categoryId: string
  categoryLabel: string
  isActive: boolean
}

type OptionDraft = {
  masterKey: LabourMasterKey
  label: string
  value: string
  description: string
  isActive: boolean
  sortOrder: number
}

type DependencyDraft = {
  industryCategoryOptionId: string
  businessTypeOptionId: string
  categoryIds: string[]
  isActive: boolean
  originalIndustryCategoryOptionId: string
  originalBusinessTypeOptionId: string
}

type IndustryBusinessDraft = {
  industryCategoryOptionId: string
  businessTypeOptionIds: string[]
  isActive: boolean
  originalIndustryCategoryOptionId: string
}

type StatusFilter = 'all' | 'active' | 'inactive'
type SortMode = 'sort' | 'label'

const toSnakeCaseCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const emptyDependencyDraft: DependencyDraft = {
  categoryIds: [],
  businessTypeOptionId: '',
  industryCategoryOptionId: '',
  isActive: true,
  originalBusinessTypeOptionId: '',
  originalIndustryCategoryOptionId: ''
}

const defaultOptionDraft = (masterKey: LabourMasterKey, sortOrder = 0): OptionDraft => ({
  masterKey,
  label: '',
  value: '',
  description: '',
  isActive: true,
  sortOrder
})

const emptyIndustryBusinessDraft: IndustryBusinessDraft = {
  industryCategoryOptionId: '',
  businessTypeOptionIds: [],
  isActive: true,
  originalIndustryCategoryOptionId: ''
}

const masterGroups: Array<{ value: MasterViewGroup; label: string }> = [
  { value: 'common', label: labourMasterGroupLabels.common },
  { value: 'worker', label: labourMasterGroupLabels.worker },
  { value: 'company', label: labourMasterGroupLabels.company },
  { value: 'jobPost', label: labourMasterGroupLabels.jobPost },
  { value: 'categoryDependencies', label: 'Category Dependencies' }
]

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : 'Request failed.'
    throw new Error(message)
  }
  return payload as T
}

const cardBorder = '1px solid #dce4ef'
const fieldStyle: CSSProperties = { marginBottom: 0 }
const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.44)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 80
}
const modalCardStyle: CSSProperties = {
  width: 'min(720px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  background: '#ffffff',
  border: cardBorder,
  borderRadius: '22px',
  padding: '22px',
  boxShadow: '0 28px 60px rgba(15, 23, 42, 0.18)',
  display: 'grid',
  gap: '16px'
}
const dependencyModalCardStyle: CSSProperties = {
  width: 'min(820px, 100%)',
  maxHeight: '85vh',
  overflow: 'hidden',
  background: '#ffffff',
  border: cardBorder,
  borderRadius: '24px',
  boxShadow: '0 28px 60px rgba(15, 23, 42, 0.18)',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr) auto'
}
const dependencyModalHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '22px 22px 18px',
  borderBottom: cardBorder
}
const dependencyModalBodyStyle: CSSProperties = {
  padding: '20px 22px',
  overflowY: 'auto',
  display: 'grid',
  gap: '16px'
}
const dependencyModalFooterStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  padding: '16px 22px 22px',
  borderTop: cardBorder,
  background: '#fcfdff'
}
const modalIconButtonStyle: CSSProperties = {
  border: cardBorder,
  background: '#ffffff',
  color: '#5e789d',
  width: '38px',
  height: '38px',
  borderRadius: '12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  lineHeight: 1,
  cursor: 'pointer',
  flexShrink: 0
}
const checkboxPanelStyle: CSSProperties = {
  border: cardBorder,
  borderRadius: '16px',
  padding: '12px',
  display: 'grid',
  gap: '12px',
  background: '#fbfcfe'
}
const checkboxRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '10px',
  width: '100%',
  minHeight: '40px',
  padding: '8px 10px',
  borderRadius: '12px',
  fontSize: '14px',
  color: '#334155',
  fontWeight: 500,
  textAlign: 'left',
  cursor: 'pointer'
}

export function LabourMastersPanel() {
  const [snapshot, setSnapshot] = useState<LabourMastersSnapshot | null>(null)
  const [marketplaceSnapshot, setMarketplaceSnapshot] = useState<LabourMarketplaceSnapshot | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('sort')
  const [selectedGroup, setSelectedGroup] = useState<MasterViewGroup>('common')
  const [selectedMasterKey, setSelectedMasterKey] = useState<LabourMasterKey>('city')
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null)
  const [editingIndustryBusinessId, setEditingIndustryBusinessId] = useState<string | null>(null)
  const [editingDependencyId, setEditingDependencyId] = useState<string | null>(null)
  const [optionModalOpen, setOptionModalOpen] = useState(false)
  const [industryBusinessModalOpen, setIndustryBusinessModalOpen] = useState(false)
  const [dependencyModalOpen, setDependencyModalOpen] = useState(false)
  const [optionDraft, setOptionDraft] = useState<OptionDraft>(defaultOptionDraft('city'))
  const [industryBusinessDraft, setIndustryBusinessDraft] = useState<IndustryBusinessDraft>(emptyIndustryBusinessDraft)
  const [dependencyDraft, setDependencyDraft] = useState<DependencyDraft>(emptyDependencyDraft)
  const [industryBusinessSearch, setIndustryBusinessSearch] = useState('')
  const [dependencyCategorySearch, setDependencyCategorySearch] = useState('')
  const [selectedDependencyIndustryOptionId, setSelectedDependencyIndustryOptionId] = useState('')
  const [selectedDependencyBusinessTypeOptionId, setSelectedDependencyBusinessTypeOptionId] = useState('')
  const [deleteMasterOption, setDeleteMasterOption] = useState<LabourMasterOption | null>(null)

  const optionsByKey = useMemo(
    () => groupLabourMasterOptions(snapshot?.options || []),
    [snapshot]
  )

  const categoryMap = useMemo(
    () => new Map(categories.map(category => [category.id, category.name])),
    [categories]
  )

  const groupedDefinitions = useMemo(() => {
    const groups = {
      common: [] as LabourMasterDefinition[],
      worker: [] as LabourMasterDefinition[],
      company: [] as LabourMasterDefinition[],
      jobPost: [] as LabourMasterDefinition[]
    }

    labourMasterKeys.forEach(key => {
      groups[labourMasterDefinitions[key].group].push(labourMasterDefinitions[key])
    })

    return groups
  }, [])

  const selectedGroupDefinitions = useMemo(() => {
    if (selectedGroup === 'categoryDependencies') return []
    return groupedDefinitions[selectedGroup]
  }, [groupedDefinitions, selectedGroup])

  const selectedMasterDefinition = selectedGroup === 'categoryDependencies'
    ? null
    : labourMasterDefinitions[selectedMasterKey]

  useEffect(() => {
    if (selectedGroup === 'categoryDependencies') return
    const availableKeys = groupedDefinitions[selectedGroup].map(definition => definition.key)
    if (!availableKeys.includes(selectedMasterKey)) {
      setSelectedMasterKey(availableKeys[0])
    }
  }, [groupedDefinitions, selectedGroup, selectedMasterKey])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [mastersPayload, labourPayload] = await Promise.all([
        parseJson<LabourMastersSnapshot>(await fetch('/api/admin/labour/masters', { cache: 'no-store' })),
        parseJson<LabourMarketplaceSnapshot>(await fetch('/api/admin/labour', { cache: 'no-store' }))
      ])

      setSnapshot(mastersPayload)
      setMarketplaceSnapshot(labourPayload)
      setCategories(Array.isArray(labourPayload.categories) ? labourPayload.categories : [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load labour masters.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const activeIndustryCategoryOptions = (optionsByKey.industry_category || []).filter(option =>
    option.isActive || option.id === dependencyDraft.industryCategoryOptionId || option.id === industryBusinessDraft.industryCategoryOptionId
  )

  const activeBusinessTypeOptions = (optionsByKey.business_type || []).filter(option =>
    option.isActive ||
    option.id === dependencyDraft.businessTypeOptionId ||
    industryBusinessDraft.businessTypeOptionIds.includes(option.id)
  )

  const dependencyBusinessTypeOptions = useMemo(() => {
    const filtered = filterBusinessTypesByIndustryDependency(
      optionsByKey.business_type || [],
      optionsByKey.industry_category || [],
      snapshot?.industryBusinessDependencies || [],
      dependencyDraft.industryCategoryOptionId
    )

    if (!dependencyDraft.businessTypeOptionId) return filtered
    if (filtered.some(option => option.id === dependencyDraft.businessTypeOptionId)) return filtered

    const selectedOption = (optionsByKey.business_type || []).find(option => option.id === dependencyDraft.businessTypeOptionId)
    return selectedOption ? [...filtered, selectedOption] : filtered
  }, [dependencyDraft.businessTypeOptionId, dependencyDraft.industryCategoryOptionId, optionsByKey, snapshot])

  const selectedIndustryBusinessTypeOptions = useMemo(
    () =>
      filterBusinessTypesByIndustryDependency(
        optionsByKey.business_type || [],
        optionsByKey.industry_category || [],
        snapshot?.industryBusinessDependencies || [],
        selectedDependencyIndustryOptionId
      ),
    [optionsByKey, selectedDependencyIndustryOptionId, snapshot]
  )

  const selectedIndustryBusinessRows = useMemo(
    () =>
      (snapshot?.industryBusinessDependencies || [])
        .filter(
          dependency =>
            dependency.isActive &&
            dependency.industryCategoryOptionId === selectedDependencyIndustryOptionId
        )
        .map<MappedBusinessTypeRow>(dependency => ({
          id: dependency.id,
          industryCategoryOptionId: dependency.industryCategoryOptionId,
          businessTypeOptionId: dependency.businessTypeOptionId,
          businessTypeLabel: resolveLabourMasterLabel(
            optionsByKey.business_type || [],
            dependency.businessTypeOptionId,
            dependency.businessTypeOptionId
          ),
          isActive: dependency.isActive
        }))
        .sort((left, right) => left.businessTypeLabel.localeCompare(right.businessTypeLabel, 'en', { sensitivity: 'base' })),
    [optionsByKey, selectedDependencyIndustryOptionId, snapshot]
  )

  const selectedIndustryBusinessGroup = useMemo(() => {
    if (!selectedDependencyIndustryOptionId || selectedIndustryBusinessRows.length === 0) return null
    return {
      id: `group-${selectedDependencyIndustryOptionId}`,
      industryCategoryOptionId: selectedDependencyIndustryOptionId,
      businessTypeOptionIds: selectedIndustryBusinessRows.map(row => row.businessTypeOptionId),
      businessTypes: selectedIndustryBusinessRows.map(row => row.businessTypeLabel),
      isActive: true,
      recordCount: selectedIndustryBusinessRows.length
    } satisfies IndustryBusinessGroupRow
  }, [selectedDependencyIndustryOptionId, selectedIndustryBusinessRows])

  const selectedIndustryCategoryRows = useMemo(
    () =>
      (snapshot?.categoryDependencies || [])
        .filter(
          dependency =>
            dependency.isActive &&
            dependency.industryCategoryOptionId === selectedDependencyIndustryOptionId &&
            dependency.businessTypeOptionId === selectedDependencyBusinessTypeOptionId
        )
        .map<MappedCategoryRow>(dependency => ({
          id: dependency.id,
          industryCategoryOptionId: dependency.industryCategoryOptionId,
          businessTypeOptionId: dependency.businessTypeOptionId,
          categoryId: dependency.categoryId,
          categoryLabel: categoryMap.get(dependency.categoryId) || dependency.categoryId,
          isActive: dependency.isActive
        }))
        .sort((left, right) => left.categoryLabel.localeCompare(right.categoryLabel, 'en', { sensitivity: 'base' })),
    [categoryMap, selectedDependencyBusinessTypeOptionId, selectedDependencyIndustryOptionId, snapshot]
  )

  const selectedIndustryCategoryGroup = useMemo(() => {
    if (
      !selectedDependencyIndustryOptionId ||
      !selectedDependencyBusinessTypeOptionId ||
      selectedIndustryCategoryRows.length === 0
    ) {
      return null
    }

    return {
      id: `group-${selectedDependencyIndustryOptionId}-${selectedDependencyBusinessTypeOptionId}`,
      industryCategoryOptionId: selectedDependencyIndustryOptionId,
      businessTypeOptionId: selectedDependencyBusinessTypeOptionId,
      categoryIds: selectedIndustryCategoryRows.map(row => row.categoryId),
      categories: selectedIndustryCategoryRows.map(row => row.categoryLabel),
      isActive: true,
      recordCount: selectedIndustryCategoryRows.length
    } satisfies DependencyGroupRow
  }, [selectedDependencyBusinessTypeOptionId, selectedDependencyIndustryOptionId, selectedIndustryCategoryRows])

  const deleteMasterContext = useMemo(() => {
    if (!deleteMasterOption) {
      return {
        businessMappingCount: 0,
        categoryMappingCount: 0,
        companyReferenceCount: 0,
        jobPostReferenceCount: 0
      }
    }

    const industryOptions = optionsByKey.industry_category || []
    const businessTypeOptions = optionsByKey.business_type || []
    const businessMappingCount = (snapshot?.industryBusinessDependencies || []).filter(dependency =>
      dependency.isActive &&
      (
        (deleteMasterOption.masterKey === 'industry_category' && dependency.industryCategoryOptionId === deleteMasterOption.id) ||
        (deleteMasterOption.masterKey === 'business_type' && dependency.businessTypeOptionId === deleteMasterOption.id)
      )
    ).length
    const categoryMappingCount = (snapshot?.categoryDependencies || []).filter(dependency =>
      dependency.isActive &&
      (
        (deleteMasterOption.masterKey === 'industry_category' && dependency.industryCategoryOptionId === deleteMasterOption.id) ||
        (deleteMasterOption.masterKey === 'business_type' && dependency.businessTypeOptionId === deleteMasterOption.id)
      )
    ).length
    const relatedCompanyIds = new Set(
      (marketplaceSnapshot?.companies || [])
        .filter(company => {
          if (deleteMasterOption.masterKey === 'industry_category') {
            const match = findMatchingMasterOption(industryOptions, company.industryCategory || '')
            return match?.id === deleteMasterOption.id
          }

          const match = findMatchingMasterOption(businessTypeOptions, company.businessType || '')
          return match?.id === deleteMasterOption.id
        })
        .map(company => company.id)
    )
    const companyReferenceCount = relatedCompanyIds.size
    const jobPostReferenceCount = (marketplaceSnapshot?.jobPosts || []).filter(jobPost =>
      relatedCompanyIds.has(jobPost.companyId)
    ).length

    return {
      businessMappingCount,
      categoryMappingCount,
      companyReferenceCount,
      jobPostReferenceCount
    }
  }, [deleteMasterOption, marketplaceSnapshot, optionsByKey.business_type, optionsByKey.industry_category, snapshot])

  useEffect(() => {
    if (selectedGroup !== 'categoryDependencies') return
    const validIndustryIds = new Set(activeIndustryCategoryOptions.map(option => option.id))
    if (selectedDependencyIndustryOptionId && !validIndustryIds.has(selectedDependencyIndustryOptionId)) {
      setSelectedDependencyIndustryOptionId(activeIndustryCategoryOptions[0]?.id || '')
      return
    }
    if (!selectedDependencyIndustryOptionId && activeIndustryCategoryOptions.length > 0) {
      setSelectedDependencyIndustryOptionId(activeIndustryCategoryOptions[0].id)
    }
  }, [activeIndustryCategoryOptions, selectedDependencyIndustryOptionId, selectedGroup])

  useEffect(() => {
    if (!selectedDependencyIndustryOptionId) {
      if (selectedDependencyBusinessTypeOptionId) {
        setSelectedDependencyBusinessTypeOptionId('')
      }
      return
    }

    const validBusinessTypeIds = new Set(selectedIndustryBusinessTypeOptions.map(option => option.id))
    if (selectedDependencyBusinessTypeOptionId && !validBusinessTypeIds.has(selectedDependencyBusinessTypeOptionId)) {
      setSelectedDependencyBusinessTypeOptionId('')
    }
  }, [selectedDependencyBusinessTypeOptionId, selectedDependencyIndustryOptionId, selectedIndustryBusinessTypeOptions])

  const resetOptionEditor = (masterKey = selectedMasterKey) => {
    setEditingOptionId(null)
    setOptionDraft(defaultOptionDraft(masterKey))
    setOptionModalOpen(false)
  }

  const resetDependencyEditor = () => {
    setEditingDependencyId(null)
    setDependencyDraft(emptyDependencyDraft)
    setDependencyCategorySearch('')
    setDependencyModalOpen(false)
  }

  const resetIndustryBusinessEditor = () => {
    setEditingIndustryBusinessId(null)
    setIndustryBusinessDraft(emptyIndustryBusinessDraft)
    setIndustryBusinessSearch('')
    setIndustryBusinessModalOpen(false)
  }

  const openCreateOption = () => {
    const currentOptions = optionsByKey[selectedMasterKey] || []
    const nextSortOrder = currentOptions.reduce((highest, option) => Math.max(highest, option.sortOrder || 0), 0) + 1
    setEditingOptionId(null)
    setOptionDraft(defaultOptionDraft(selectedMasterKey, nextSortOrder))
    setOptionModalOpen(true)
  }

  const openEditOption = (option: LabourMasterOption) => {
    setEditingOptionId(option.id)
    setOptionDraft({
      masterKey: option.masterKey,
      label: option.label,
      value: option.value,
      description: option.description,
      isActive: option.isActive,
      sortOrder: option.sortOrder
    })
    setOptionModalOpen(true)
  }

  const openDeleteMasterOption = (option: LabourMasterOption) => {
    setDeleteMasterOption(option)
  }

  const closeDeleteMasterOption = () => {
    if (saving) return
    setDeleteMasterOption(null)
  }

  const openCreateIndustryBusiness = () => {
    setEditingIndustryBusinessId(null)
    setIndustryBusinessDraft({
      ...emptyIndustryBusinessDraft,
      industryCategoryOptionId: selectedDependencyIndustryOptionId
    })
    setIndustryBusinessSearch('')
    setIndustryBusinessModalOpen(true)
  }

  const openEditIndustryBusiness = (group: IndustryBusinessGroupRow) => {
    setEditingIndustryBusinessId(group.id)
    setIndustryBusinessDraft({
      industryCategoryOptionId: group.industryCategoryOptionId,
      businessTypeOptionIds: group.businessTypeOptionIds,
      isActive: group.isActive,
      originalIndustryCategoryOptionId: group.industryCategoryOptionId
    })
    setIndustryBusinessSearch('')
    setIndustryBusinessModalOpen(true)
  }

  const openCreateDependency = () => {
    setEditingDependencyId(null)
    setDependencyDraft({
      ...emptyDependencyDraft,
      industryCategoryOptionId: selectedDependencyIndustryOptionId,
      businessTypeOptionId: selectedDependencyBusinessTypeOptionId,
      originalIndustryCategoryOptionId: selectedDependencyIndustryOptionId,
      originalBusinessTypeOptionId: selectedDependencyBusinessTypeOptionId
    })
    setDependencyCategorySearch('')
    setDependencyModalOpen(true)
  }

  const openEditDependency = (group: DependencyGroupRow) => {
    setEditingDependencyId(group.id)
    setDependencyDraft({
      categoryIds: group.categoryIds,
      businessTypeOptionId: group.businessTypeOptionId,
      industryCategoryOptionId: group.industryCategoryOptionId,
      isActive: group.isActive,
      originalBusinessTypeOptionId: group.businessTypeOptionId,
      originalIndustryCategoryOptionId: group.industryCategoryOptionId
    })
    setDependencyCategorySearch('')
    setDependencyModalOpen(true)
  }

  const saveOption = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/masters', {
        method: editingOptionId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingOptionId
            ? { kind: 'option', id: editingOptionId, payload: optionDraft }
            : { kind: 'option', payload: optionDraft }
        )
      })

      const payload = await parseJson<{ snapshot: LabourMastersSnapshot }>(response)
      setSnapshot(payload.snapshot)
      resetOptionEditor(optionDraft.masterKey)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save master option.')
    } finally {
      setSaving(false)
    }
  }

  const handleOptionLabelChange = (label: string) => {
    setOptionDraft(current => {
      const shouldSyncValue =
        current.masterKey === 'business_type' &&
        (
          current.value.trim().length === 0 ||
          current.value === toSnakeCaseCode(current.label)
        )

      return {
        ...current,
        label,
        value: shouldSyncValue ? toSnakeCaseCode(label) : current.value
      }
    })
  }

  const handleOptionValueChange = (value: string) => {
    setOptionDraft(current => ({
      ...current,
      value: current.masterKey === 'business_type' ? toSnakeCaseCode(value) : value
    }))
  }

  const confirmDeleteMasterOption = async () => {
    if (!deleteMasterOption) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/masters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'option',
          id: deleteMasterOption.id
        })
      })

      const payload = await parseJson<{ snapshot: LabourMastersSnapshot }>(response)
      setSnapshot(payload.snapshot)
      setDeleteMasterOption(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to delete master value.')
    } finally {
      setSaving(false)
    }
  }

  const clearAllDependencyMappings = async () => {
    const confirmed = window.confirm(
      'Are you sure? This will clear all dependency mappings only. Master values and saved records will not be deleted.'
    )
    if (!confirmed) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/masters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'allDependencies' })
      })

      const payload = await parseJson<{ snapshot: LabourMastersSnapshot }>(response)
      setSnapshot(payload.snapshot)
      setSelectedDependencyBusinessTypeOptionId('')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to clear dependency mappings.')
    } finally {
      setSaving(false)
    }
  }

  const saveDependency = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/masters', {
        method: editingDependencyId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingDependencyId
            ? { kind: 'dependency', id: editingDependencyId, payload: dependencyDraft }
            : { kind: 'dependency', payload: dependencyDraft }
        )
      })

      const payload = await parseJson<{ snapshot: LabourMastersSnapshot }>(response)
      setSnapshot(payload.snapshot)
      resetDependencyEditor()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save dependency mapping.')
    } finally {
      setSaving(false)
    }
  }

  const saveIndustryBusiness = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/masters', {
        method: editingIndustryBusinessId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingIndustryBusinessId
            ? { kind: 'industryBusiness', id: editingIndustryBusinessId, payload: industryBusinessDraft }
            : { kind: 'industryBusiness', payload: industryBusinessDraft }
        )
      })

      const payload = await parseJson<{ snapshot: LabourMastersSnapshot }>(response)
      setSnapshot(payload.snapshot)
      resetIndustryBusinessEditor()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save Industry Category to Business Type mapping.')
    } finally {
      setSaving(false)
    }
  }

  const toggleOption = async (option: LabourMasterOption) => {
    const confirmed = window.confirm(`${option.isActive ? 'Deactivate' : 'Activate'} "${option.label}"?`)
    if (!confirmed) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/masters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'option',
          id: option.id,
          payload: {
            masterKey: option.masterKey,
            label: option.label,
            value: option.value,
            description: option.description,
            isActive: !option.isActive,
            sortOrder: option.sortOrder
          }
        })
      })

      const payload = await parseJson<{ snapshot: LabourMastersSnapshot }>(response)
      setSnapshot(payload.snapshot)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update master option.')
    } finally {
      setSaving(false)
    }
  }

  const removeIndustryBusinessMapping = async (row: MappedBusinessTypeRow) => {
    const industryLabel = resolveLabourMasterLabel(
      optionsByKey.industry_category || [],
      row.industryCategoryOptionId,
      row.industryCategoryOptionId
    )
    const confirmed = window.confirm(
      `Remove ${row.businessTypeLabel} from ${industryLabel}? This only removes the mapping and does not delete the master value.`
    )
    if (!confirmed) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/masters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'industryBusiness',
          payload: {
            industryCategoryOptionId: row.industryCategoryOptionId,
            businessTypeOptionId: row.businessTypeOptionId
          }
        })
      })

      const payload = await parseJson<{ snapshot: LabourMastersSnapshot }>(response)
      setSnapshot(payload.snapshot)
      if (selectedDependencyBusinessTypeOptionId === row.businessTypeOptionId) {
        setSelectedDependencyBusinessTypeOptionId('')
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to remove Business Type mapping.')
    } finally {
      setSaving(false)
    }
  }

  const removeCategoryMapping = async (row: MappedCategoryRow) => {
    const industryLabel = resolveLabourMasterLabel(
      optionsByKey.industry_category || [],
      row.industryCategoryOptionId,
      row.industryCategoryOptionId
    )
    const businessTypeLabel = resolveLabourMasterLabel(
      optionsByKey.business_type || [],
      row.businessTypeOptionId,
      row.businessTypeOptionId
    )
    const confirmed = window.confirm(
      `Remove ${row.categoryLabel} from ${industryLabel} + ${businessTypeLabel}? This only removes the mapping and does not delete the category.`
    )
    if (!confirmed) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/masters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'dependency',
          payload: {
            industryCategoryOptionId: row.industryCategoryOptionId,
            businessTypeOptionId: row.businessTypeOptionId,
            categoryId: row.categoryId
          }
        })
      })

      const payload = await parseJson<{ snapshot: LabourMastersSnapshot }>(response)
      setSnapshot(payload.snapshot)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to remove Labour Category mapping.')
    } finally {
      setSaving(false)
    }
  }

  const clearCategoryMappingsForSelection = async () => {
    if (!selectedDependencyIndustryOptionId || !selectedDependencyBusinessTypeOptionId) return

    const industryLabel = resolveLabourMasterLabel(
      optionsByKey.industry_category || [],
      selectedDependencyIndustryOptionId,
      selectedDependencyIndustryOptionId
    )
    const businessTypeLabel = resolveLabourMasterLabel(
      optionsByKey.business_type || [],
      selectedDependencyBusinessTypeOptionId,
      selectedDependencyBusinessTypeOptionId
    )
    const confirmed = window.confirm(
      `This will remove all Labour Category mappings for ${industryLabel} + ${businessTypeLabel}. Continue?`
    )
    if (!confirmed) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/admin/labour/masters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'dependencyGroup',
          payload: {
            industryCategoryOptionId: selectedDependencyIndustryOptionId,
            businessTypeOptionId: selectedDependencyBusinessTypeOptionId
          }
        })
      })

      const payload = await parseJson<{ snapshot: LabourMastersSnapshot }>(response)
      setSnapshot(payload.snapshot)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to clear Labour Category mappings.')
    } finally {
      setSaving(false)
    }
  }

  const selectedMasterOptions = useMemo(() => {
    const query = search.trim().toLowerCase()
    const baseOptions = optionsByKey[selectedMasterKey] || []
    const searched = baseOptions.filter(option => {
      if (!query) return true
      return [option.label, option.value, option.description].some(value =>
        value.toLowerCase().includes(query)
      )
    })

    const filtered = searched.filter(option => {
      if (statusFilter === 'all') return true
      return statusFilter === 'active' ? option.isActive : !option.isActive
    })

    return [...filtered].sort((left, right) => {
      if (sortMode === 'label') {
        return left.label.localeCompare(right.label, 'en', { sensitivity: 'base' })
      }
      if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder
      return left.label.localeCompare(right.label, 'en', { sensitivity: 'base' })
    })
  }, [optionsByKey, search, selectedMasterKey, sortMode, statusFilter])

  const visibleDependencyCategories = useMemo(() => {
    const query = dependencyCategorySearch.trim().toLowerCase()
    return categories
      .filter(category => (category.isActive !== false) || dependencyDraft.categoryIds.includes(category.id))
      .filter(category => !query || category.name.toLowerCase().includes(query))
      .sort((left, right) => left.name.localeCompare(right.name, 'en', { sensitivity: 'base' }))
  }, [categories, dependencyCategorySearch, dependencyDraft.categoryIds])

  const visibleIndustryBusinessTypes = useMemo(() => {
    const query = industryBusinessSearch.trim().toLowerCase()
    return activeBusinessTypeOptions
      .filter(option => !query || option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query))
      .sort((left, right) => left.label.localeCompare(right.label, 'en', { sensitivity: 'base' }))
  }, [activeBusinessTypeOptions, industryBusinessSearch])

  const availableDependencyBusinessTypeIds = useMemo(
    () => new Set(dependencyBusinessTypeOptions.map(option => option.id)),
    [dependencyBusinessTypeOptions]
  )
  const dependencyHasIndustrySelection = dependencyDraft.industryCategoryOptionId.trim().length > 0
  const dependencyHasBusinessTypeSelection = dependencyDraft.businessTypeOptionId.trim().length > 0
  const existingCategoryMappingCount = useMemo(
    () =>
      (snapshot?.categoryDependencies || []).filter(
        dependency =>
          dependency.isActive &&
          dependency.industryCategoryOptionId === dependencyDraft.industryCategoryOptionId &&
          dependency.businessTypeOptionId === dependencyDraft.businessTypeOptionId
      ).length,
    [dependencyDraft.businessTypeOptionId, dependencyDraft.industryCategoryOptionId, snapshot]
  )

  const toggleDependencyCategory = (categoryId: string, checked: boolean) => {
    setDependencyDraft(current => ({
      ...current,
      categoryIds: checked
        ? Array.from(new Set([...current.categoryIds, categoryId]))
        : current.categoryIds.filter(id => id !== categoryId)
    }))
  }

  const selectAllVisibleDependencyCategories = () => {
    setDependencyDraft(current => ({
      ...current,
      categoryIds: Array.from(new Set([...current.categoryIds, ...visibleDependencyCategories.map(category => category.id)]))
    }))
  }

  const clearDependencyCategories = () => {
    setDependencyDraft(current => ({ ...current, categoryIds: [] }))
  }

  const toggleIndustryBusinessType = (businessTypeOptionId: string, checked: boolean) => {
    setIndustryBusinessDraft(current => ({
      ...current,
      businessTypeOptionIds: checked
        ? Array.from(new Set([...current.businessTypeOptionIds, businessTypeOptionId]))
        : current.businessTypeOptionIds.filter(id => id !== businessTypeOptionId)
    }))
  }

  const selectAllVisibleIndustryBusinessTypes = () => {
    setIndustryBusinessDraft(current => ({
      ...current,
      businessTypeOptionIds: Array.from(new Set([...current.businessTypeOptionIds, ...visibleIndustryBusinessTypes.map(option => option.id)]))
    }))
  }

  const clearIndustryBusinessTypes = () => {
    setIndustryBusinessDraft(current => ({ ...current, businessTypeOptionIds: [] }))
  }

  useEffect(() => {
    if (!dependencyHasIndustrySelection) {
      setDependencyDraft(current => (
        current.businessTypeOptionId || current.categoryIds.length
          ? { ...current, businessTypeOptionId: '', categoryIds: [] }
          : current
      ))
      return
    }

    if (dependencyDraft.businessTypeOptionId && !availableDependencyBusinessTypeIds.has(dependencyDraft.businessTypeOptionId)) {
      setDependencyDraft(current => ({ ...current, businessTypeOptionId: '', categoryIds: [] }))
    }
  }, [availableDependencyBusinessTypeIds, dependencyDraft.businessTypeOptionId, dependencyHasIndustrySelection])

  useEffect(() => {
    if (!dependencyHasBusinessTypeSelection && dependencyDraft.categoryIds.length > 0) {
      setDependencyDraft(current => ({ ...current, categoryIds: [] }))
    }
  }, [dependencyDraft.categoryIds.length, dependencyHasBusinessTypeSelection])

  if (loading) {
    return (
      <div className="surface-card content-panel">
        <div className="muted">Loading labour masters...</div>
      </div>
    )
  }

  return (
    <section className="surface-card content-panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Masters and dependencies</h2>
          <p className="panel-copy">Manage labour master values through compact dropdown-based controls and keep category mappings aligned with Business Type and Industry Category.</p>
        </div>
        <div className="actions">
          <span className={`chip ${snapshot?.storage === 'supabase' ? 'success' : 'neutral'}`}>
            {snapshot?.storage === 'supabase' ? 'Live Supabase storage' : 'JSON fallback storage'}
          </span>
          <button className="secondary-btn" onClick={() => void loadData()} disabled={saving}>Refresh</button>
        </div>
      </div>

      {error ? <div className="flash error" style={{ marginBottom: 14 }}>{error}</div> : null}

      <div className="inner-card" style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) minmax(180px, 240px) minmax(220px, 1fr) minmax(130px, 160px) minmax(130px, 160px) auto', gap: 12, alignItems: 'end' }}>
          <div className="field" style={fieldStyle}>
            <label>Master Group</label>
            <select value={selectedGroup} onChange={event => setSelectedGroup(event.target.value as MasterViewGroup)}>
              {masterGroups.map(group => (
                <option key={group.value} value={group.value}>{group.label}</option>
              ))}
            </select>
          </div>

          <div className="field" style={fieldStyle}>
            <label>Master Type</label>
            <select
              value={selectedGroup === 'categoryDependencies' ? 'dependencies' : selectedMasterKey}
              onChange={event => setSelectedMasterKey(event.target.value as LabourMasterKey)}
              disabled={selectedGroup === 'categoryDependencies'}
            >
              {selectedGroup === 'categoryDependencies' ? (
                <option value="dependencies">Dependency Manager</option>
              ) : (
                selectedGroupDefinitions.map(definition => (
                  <option key={definition.key} value={definition.key}>{definition.label}</option>
                ))
              )}
            </select>
          </div>

          <div className="field" style={fieldStyle}>
            <label>Search</label>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={selectedGroup === 'categoryDependencies' ? 'Search category mappings' : 'Search label, value, or description'}
            />
          </div>

          <div className="field" style={fieldStyle}>
            <label>Status</label>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="field" style={fieldStyle}>
            <label>Sort</label>
            <select value={sortMode} onChange={event => setSortMode(event.target.value as SortMode)}>
              <option value="sort">Sort Order</option>
              <option value="label">Label</option>
            </select>
          </div>

          {selectedGroup === 'categoryDependencies' ? (
            <div className="actions" style={{ justifyContent: 'flex-end' }}>
              <button className="secondary-btn" onClick={openCreateIndustryBusiness} disabled={saving}>
                Add Business Type Mapping
              </button>
              <button className="primary-btn" onClick={openCreateDependency} disabled={saving}>
                Add Category Mapping
              </button>
            </div>
          ) : (
            <button
              className="primary-btn"
              onClick={openCreateOption}
              disabled={saving || !selectedMasterDefinition}
            >
              Add New Value
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {selectedGroup === 'categoryDependencies' ? (
            <span className="chip neutral">Manual dependency manager</span>
          ) : (
            <>
              <span className="chip neutral">{selectedMasterDefinition?.label}</span>
              <span className="chip neutral">{selectedMasterOptions.length} values</span>
              <span className="chip neutral">{(optionsByKey[selectedMasterKey] || []).filter(item => item.isActive).length} active</span>
            </>
          )}
        </div>
      </div>

      <div className="inner-card" style={{ marginTop: 16, display: 'grid', gap: 14 }}>
        <div>
          <h3 style={{ margin: 0, color: '#13233f', fontSize: 18, fontWeight: 600 }}>
            {selectedGroup === 'categoryDependencies' ? 'Category dependency manager' : selectedMasterDefinition?.label}
          </h3>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            {selectedGroup === 'categoryDependencies'
              ? 'Build the dependency flow in this order: Industry Category, then Business Type, then Labour Categories. Active mappings drive filtering in the Labour Exchange admin.'
              : selectedMasterDefinition?.description}
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {selectedGroup === 'categoryDependencies' ? (
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ border: cardBorder, borderRadius: 18, padding: 18, display: 'grid', gap: 14, background: '#fcfdff' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#13233f', fontSize: 17, fontWeight: 600 }}>Step 1: Select Industry Category</h4>
                  <p className="muted" style={{ margin: '6px 0 0' }}>Start the manual dependency flow by choosing the Industry Category you want to manage.</p>
                </div>
                <div className="field" style={{ ...fieldStyle, maxWidth: 420 }}>
                  <label>Industry Category</label>
                  <select
                    value={selectedDependencyIndustryOptionId}
                    onChange={event => setSelectedDependencyIndustryOptionId(event.target.value)}
                  >
                    <option value="">Select Industry Category</option>
                    {activeIndustryCategoryOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ border: cardBorder, borderRadius: 18, padding: 18, display: 'grid', gap: 14, background: '#fcfdff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#13233f', fontSize: 17, fontWeight: 600 }}>Step 2: Map Business Types</h4>
                    <p className="muted" style={{ margin: '6px 0 0' }}>Add or remove Business Types only under the currently selected Industry Category.</p>
                  </div>
                  <div className="actions">
                    <button className="secondary-btn" onClick={() => void clearAllDependencyMappings()} disabled={saving}>
                      Clear All Dependency Mappings
                    </button>
                    <button className="secondary-btn" onClick={() => selectedIndustryBusinessGroup && openEditIndustryBusiness(selectedIndustryBusinessGroup)} disabled={saving || !selectedIndustryBusinessGroup}>
                      Edit Business Types
                    </button>
                    <button className="primary-btn" onClick={openCreateIndustryBusiness} disabled={saving || !selectedDependencyIndustryOptionId}>Add Business Type Mapping</button>
                  </div>
                </div>

                {!selectedDependencyIndustryOptionId ? (
                  <div className="muted">Select an Industry Category to manage its Business Types.</div>
                ) : selectedIndustryBusinessRows.length === 0 ? (
                  <div className="muted">No Business Types mapped for this Industry Category.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 760 }}>
                    <thead>
                      <tr style={{ textAlign: 'left' }}>
                        {['Industry Category', 'Business Type', 'Status', 'Actions'].map(label => (
                          <th key={label} style={{ padding: '0 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5e789d' }}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIndustryBusinessRows.map(row => (
                        <tr key={row.id}>
                          <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder, color: '#516981', fontSize: 14 }}>
                            {resolveLabourMasterLabel(optionsByKey.industry_category || [], row.industryCategoryOptionId, row.industryCategoryOptionId)}
                          </td>
                          <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder, color: '#13233f', fontSize: 14, fontWeight: 600 }}>
                            {row.businessTypeLabel}
                          </td>
                          <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder }}>
                            <span className={`chip ${row.isActive ? 'success' : 'warning'}`}>{row.isActive ? 'Active' : 'Inactive'}</span>
                          </td>
                          <td style={{ padding: '12px 0 12px 0', borderTop: cardBorder }}>
                            <div className="actions">
                              <button className="secondary-btn" onClick={() => selectedIndustryBusinessGroup && openEditIndustryBusiness(selectedIndustryBusinessGroup)} disabled={saving || !selectedIndustryBusinessGroup}>
                                Edit Set
                              </button>
                              <button className="secondary-btn" onClick={() => void removeIndustryBusinessMapping(row)} disabled={saving}>
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{ border: cardBorder, borderRadius: 18, padding: 18, display: 'grid', gap: 14, background: '#fcfdff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#13233f', fontSize: 17, fontWeight: 600 }}>Step 3: Map Labour Categories</h4>
                    <p className="muted" style={{ margin: '6px 0 0' }}>After selecting an Industry Category and one mapped Business Type, add or remove only the Labour Categories for that exact pair.</p>
                  </div>
                  <div className="actions">
                    <button className="secondary-btn" onClick={clearCategoryMappingsForSelection} disabled={saving || !selectedDependencyIndustryOptionId || !selectedDependencyBusinessTypeOptionId || selectedIndustryCategoryRows.length === 0}>
                      Clear Labour Category Mappings
                    </button>
                    <button className="secondary-btn" onClick={() => selectedIndustryCategoryGroup && openEditDependency(selectedIndustryCategoryGroup)} disabled={saving || !selectedIndustryCategoryGroup}>
                      Edit Labour Categories
                    </button>
                    <button className="primary-btn" onClick={openCreateDependency} disabled={saving || !selectedDependencyIndustryOptionId || !selectedDependencyBusinessTypeOptionId}>Add Labour Category Mapping</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  <div className="field" style={fieldStyle}>
                    <label>Industry Category</label>
                    <input
                      value={selectedDependencyIndustryOptionId
                        ? resolveLabourMasterLabel(optionsByKey.industry_category || [], selectedDependencyIndustryOptionId, selectedDependencyIndustryOptionId)
                        : ''}
                      placeholder="Select Industry Category above"
                      readOnly
                    />
                  </div>
                  <div className="field" style={fieldStyle}>
                    <label>Business Type</label>
                    <select
                      value={selectedDependencyBusinessTypeOptionId}
                      onChange={event => setSelectedDependencyBusinessTypeOptionId(event.target.value)}
                      disabled={!selectedDependencyIndustryOptionId}
                    >
                      <option value="">
                        {selectedDependencyIndustryOptionId ? 'Select Business Type' : 'Select Industry Category first'}
                      </option>
                      {selectedIndustryBusinessTypeOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                    {!selectedDependencyIndustryOptionId ? (
                      <div className="muted" style={{ marginTop: 6 }}>Select an Industry Category to load Business Types.</div>
                    ) : selectedIndustryBusinessTypeOptions.length === 0 ? (
                      <div className="muted" style={{ marginTop: 6 }}>No Business Types mapped for this Industry Category.</div>
                    ) : null}
                  </div>
                </div>

                {!selectedDependencyIndustryOptionId || !selectedDependencyBusinessTypeOptionId ? (
                  <div className="muted">Select an Industry Category and Business Type to manage Labour Category mappings.</div>
                ) : selectedIndustryCategoryRows.length === 0 ? (
                  <div className="muted">No Labour Category mappings found for this Industry Category and Business Type.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 940 }}>
                    <thead>
                      <tr style={{ textAlign: 'left' }}>
                        {['Industry Category', 'Business Type', 'Labour Category', 'Status', 'Actions'].map(label => (
                          <th key={label} style={{ padding: '0 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5e789d' }}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIndustryCategoryRows.map(row => (
                        <tr key={row.id}>
                          <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder, color: '#516981', fontSize: 14 }}>
                            {resolveLabourMasterLabel(optionsByKey.industry_category || [], row.industryCategoryOptionId, row.industryCategoryOptionId)}
                          </td>
                          <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder, color: '#516981', fontSize: 14 }}>
                            {resolveLabourMasterLabel(optionsByKey.business_type || [], row.businessTypeOptionId, row.businessTypeOptionId)}
                          </td>
                          <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder, color: '#13233f', fontSize: 14, fontWeight: 600 }}>
                            {row.categoryLabel}
                          </td>
                          <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder }}>
                            <span className={`chip ${row.isActive ? 'success' : 'warning'}`}>{row.isActive ? 'Active' : 'Inactive'}</span>
                          </td>
                          <td style={{ padding: '12px 0 12px 0', borderTop: cardBorder }}>
                            <div className="actions">
                              <button className="secondary-btn" onClick={() => selectedIndustryCategoryGroup && openEditDependency(selectedIndustryCategoryGroup)} disabled={saving || !selectedIndustryCategoryGroup}>
                                Edit Set
                              </button>
                              <button className="secondary-btn" onClick={() => void removeCategoryMapping(row)} disabled={saving}>
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : selectedMasterOptions.length === 0 ? (
            <div className="muted">
              {selectedMasterKey === 'industry_category'
                ? 'No active Industry Categories found. Add a new Industry Category to continue.'
                : 'No master values match the current filters.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 860 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {['Label', 'Value', 'Description', 'Sort', 'Status', 'Actions'].map(label => (
                    <th key={label} style={{ padding: '0 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5e789d' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedMasterOptions.map(option => (
                  <tr key={option.id}>
                    <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder, color: '#13233f', fontSize: 14, fontWeight: 600 }}>{option.label}</td>
                    <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder, color: '#516981', fontSize: 14 }}>{option.value}</td>
                    <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder, color: '#516981', fontSize: 14 }}>{option.description || 'No description'}</td>
                    <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder, color: '#13233f', fontSize: 14 }}>{option.sortOrder}</td>
                    <td style={{ padding: '12px 10px 12px 0', borderTop: cardBorder }}>
                      <span className={`chip ${option.isActive ? 'success' : 'warning'}`}>{option.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '12px 0 12px 0', borderTop: cardBorder }}>
                      <div className="actions">
                        <button className="secondary-btn" onClick={() => openEditOption(option)} disabled={saving}>Edit</button>
                        <button className="secondary-btn" onClick={() => void toggleOption(option)} disabled={saving}>
                          {option.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {option.masterKey === 'industry_category' || option.masterKey === 'business_type' ? (
                          <button
                            className="secondary-btn"
                            onClick={() => openDeleteMasterOption(option)}
                            disabled={saving}
                            style={{ color: '#b42318', borderColor: '#f3b1a5', background: '#fff8f7' }}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {optionModalOpen ? (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div className="panel-head">
              <div>
                <h3 style={{ margin: 0, color: '#13233f', fontSize: 20, fontWeight: 600 }}>
                  {optionDraft.masterKey === 'business_type'
                    ? editingOptionId
                      ? 'Edit Business Type'
                      : 'Add Business Type'
                    : editingOptionId
                      ? 'Edit Master Value'
                      : 'Add New Value'}
                </h3>
                <p className="panel-copy">
                  {optionDraft.masterKey === 'business_type'
                    ? 'Create a reusable Business Type master value. You can map this Business Type to Industry Categories later.'
                    : editingOptionId
                      ? 'Update the selected labour master without changing any connected record format.'
                      : 'Create a new master value for the selected labour master type.'}
                </p>
              </div>
              <button className="secondary-btn" onClick={() => resetOptionEditor(optionDraft.masterKey)} disabled={saving}>Cancel</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field" style={fieldStyle}>
                <label>Master Group</label>
                <input value={labourMasterGroupLabels[labourMasterDefinitions[optionDraft.masterKey].group]} readOnly />
              </div>
              <div className="field" style={fieldStyle}>
                <label>Master Type</label>
                <input value={labourMasterDefinitions[optionDraft.masterKey].label} readOnly />
              </div>
              <div className="field" style={fieldStyle}>
                <label>Label / Name</label>
                <input value={optionDraft.label} onChange={event => handleOptionLabelChange(event.target.value)} />
              </div>
              <div className="field" style={fieldStyle}>
                <label>Value / Code</label>
                <input
                  value={optionDraft.value}
                  onChange={event => handleOptionValueChange(event.target.value)}
                  placeholder={optionDraft.masterKey === 'business_type' ? 'manufacturer' : ''}
                />
              </div>
              <div className="field" style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                <label>Description</label>
                <input value={optionDraft.description} onChange={event => setOptionDraft(current => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="field" style={fieldStyle}>
                <label>Sort Order</label>
                <input type="number" value={optionDraft.sortOrder} onChange={event => setOptionDraft(current => ({ ...current, sortOrder: Number(event.target.value) }))} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', fontWeight: 600 }}>
                <input type="checkbox" checked={optionDraft.isActive} onChange={event => setOptionDraft(current => ({ ...current, isActive: event.target.checked }))} />
                Keep this value active
              </label>
            </div>

            <div className="actions">
              <button className="primary-btn" onClick={() => void saveOption()} disabled={saving}>
                {editingOptionId ? 'Update Value' : 'Save Value'}
              </button>
              <button className="secondary-btn" onClick={() => resetOptionEditor(optionDraft.masterKey)} disabled={saving}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      {industryBusinessModalOpen ? (
        <div style={modalOverlayStyle}>
          <div style={dependencyModalCardStyle}>
            <div style={dependencyModalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, color: '#13233f', fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>
                  {editingIndustryBusinessId ? 'Edit Business Type Mappings' : 'Add Business Type Mappings'}
                </h3>
                <p className="panel-copy" style={{ margin: '8px 0 0', maxWidth: 620, fontSize: 14, lineHeight: 1.55 }}>
                  Select one Industry Category and map the Business Types that should appear under it in the Labour Exchange admin.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close Industry Category to Business Type modal"
                onClick={resetIndustryBusinessEditor}
                disabled={saving}
                style={modalIconButtonStyle}
              >
                X
              </button>
            </div>

            <div style={dependencyModalBodyStyle}>
              <div className="field" style={fieldStyle}>
                <label>Industry Category</label>
                <select
                  value={industryBusinessDraft.industryCategoryOptionId}
                  onChange={event => setIndustryBusinessDraft(current => ({
                    ...current,
                    industryCategoryOptionId: event.target.value
                  }))}
                >
                  <option value="">Select Industry Category</option>
                  {activeIndustryCategoryOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                  <label style={{ margin: 0 }}>Business Types</label>
                  <span className="chip neutral">
                    {industryBusinessDraft.businessTypeOptionIds.length} {industryBusinessDraft.businessTypeOptionIds.length === 1 ? 'business type' : 'business types'} selected
                  </span>
                </div>
                <div style={checkboxPanelStyle}>
                  <input
                    value={industryBusinessSearch}
                    onChange={event => setIndustryBusinessSearch(event.target.value)}
                    placeholder="Search business types"
                    aria-label="Search business types"
                    disabled={!industryBusinessDraft.industryCategoryOptionId}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={selectAllVisibleIndustryBusinessTypes}
                      disabled={saving || !industryBusinessDraft.industryCategoryOptionId || visibleIndustryBusinessTypes.length === 0}
                    >
                      Select All Visible
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={clearIndustryBusinessTypes}
                      disabled={saving || industryBusinessDraft.businessTypeOptionIds.length === 0}
                    >
                      Clear Selection
                    </button>
                  </div>
                  {!industryBusinessDraft.industryCategoryOptionId ? (
                    <div className="muted" style={{ padding: 8 }}>Select an Industry Category to load Business Types.</div>
                  ) : (
                    <div style={{ border: cardBorder, borderRadius: 14, padding: 6, maxHeight: 260, overflowY: 'auto', display: 'grid', gap: 4, background: '#ffffff' }}>
                      {visibleIndustryBusinessTypes.length === 0 ? (
                        <div className="muted" style={{ padding: 8 }}>No active Business Types are available to map right now.</div>
                      ) : (
                        visibleIndustryBusinessTypes.map(option => (
                          <label
                            key={option.id}
                            style={{
                              ...checkboxRowStyle,
                              background: industryBusinessDraft.businessTypeOptionIds.includes(option.id) ? '#f3f7ff' : 'transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={industryBusinessDraft.businessTypeOptionIds.includes(option.id)}
                              onChange={event => toggleIndustryBusinessType(option.id, event.target.checked)}
                              style={{ margin: 0, width: 16, height: 16, flexShrink: 0 }}
                            />
                            <span style={{ flex: 1, minWidth: 0 }}>{option.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8, fontSize: 13, color: '#334155', fontWeight: 600, marginTop: -2 }}>
                <input type="checkbox" checked={industryBusinessDraft.isActive} onChange={event => setIndustryBusinessDraft(current => ({ ...current, isActive: event.target.checked }))} />
                Keep these Business Type mappings active
              </label>
            </div>

            <div style={dependencyModalFooterStyle}>
              <button className="secondary-btn" onClick={resetIndustryBusinessEditor} disabled={saving}>Cancel</button>
              <button className="primary-btn" onClick={() => void saveIndustryBusiness()} disabled={saving}>
                {editingIndustryBusinessId ? 'Update Business Types' : 'Save Business Types'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dependencyModalOpen ? (
        <div style={modalOverlayStyle}>
          <div style={dependencyModalCardStyle}>
            <div style={dependencyModalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, color: '#13233f', fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>
                  {editingDependencyId ? 'Edit Category Mappings' : 'Add Category Mappings'}
                </h3>
                <p className="panel-copy" style={{ margin: '8px 0 0', maxWidth: 620, fontSize: 14, lineHeight: 1.55 }}>
                  Select one Industry Category first, load its mapped Business Types, then choose one Business Type and map the Labour Categories that should appear in the Labour Exchange admin.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close category mapping modal"
                onClick={resetDependencyEditor}
                disabled={saving}
                style={modalIconButtonStyle}
              >
                X
              </button>
            </div>

            <div style={dependencyModalBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div className="field" style={fieldStyle}>
                  <label>Industry Category</label>
                  <select
                    value={dependencyDraft.industryCategoryOptionId}
                    onChange={event => setDependencyDraft(current => ({
                      ...current,
                      industryCategoryOptionId: event.target.value
                    }))}
                  >
                    <option value="">Select Industry Category</option>
                    {activeIndustryCategoryOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={fieldStyle}>
                  <label>Business Type</label>
                  <select
                    value={dependencyDraft.businessTypeOptionId}
                    onChange={event => setDependencyDraft(current => ({ ...current, businessTypeOptionId: event.target.value }))}
                    disabled={!dependencyHasIndustrySelection}
                  >
                    <option value="">
                      {dependencyHasIndustrySelection ? 'Select Business Type' : 'Select Industry Category first'}
                    </option>
                    {dependencyBusinessTypeOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  {!dependencyHasIndustrySelection ? (
                    <div className="muted" style={{ marginTop: 6 }}>Select an Industry Category to load Business Types.</div>
                  ) : dependencyBusinessTypeOptions.length === 0 ? (
                    <div className="muted" style={{ marginTop: 6 }}>No Business Type mappings found for this Industry Category.</div>
                  ) : null}
                </div>
              </div>

              <div className="field" style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                  <label style={{ margin: 0 }}>Categories</label>
                  <span className="chip neutral">
                    {dependencyDraft.categoryIds.length} {dependencyDraft.categoryIds.length === 1 ? 'category' : 'categories'} selected
                  </span>
                </div>
                <div style={checkboxPanelStyle}>
                  <input
                    value={dependencyCategorySearch}
                    onChange={event => setDependencyCategorySearch(event.target.value)}
                    placeholder="Search categories"
                    aria-label="Search categories"
                    disabled={!dependencyHasBusinessTypeSelection}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={selectAllVisibleDependencyCategories}
                      disabled={saving || !dependencyHasBusinessTypeSelection || visibleDependencyCategories.length === 0}
                    >
                      Select All Visible
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={clearDependencyCategories}
                      disabled={saving || dependencyDraft.categoryIds.length === 0}
                    >
                      Clear Selection
                    </button>
                  </div>
                  {!dependencyHasBusinessTypeSelection ? (
                    <div className="muted" style={{ padding: 8 }}>Select a Business Type to load Categories.</div>
                  ) : (
                    <>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {existingCategoryMappingCount === 0
                          ? 'No categories mapped for this Industry Category and Business Type yet. Choose one or more categories to create the first set.'
                          : `${existingCategoryMappingCount} active category mapping${existingCategoryMappingCount === 1 ? '' : 's'} already exist for this Industry Category and Business Type.`}
                      </div>
                      <div style={{ border: cardBorder, borderRadius: 14, padding: 6, maxHeight: 260, overflowY: 'auto', display: 'grid', gap: 4, background: '#ffffff' }}>
                        {visibleDependencyCategories.length === 0 ? (
                          <div className="muted" style={{ padding: 8 }}>No categories match the current search.</div>
                        ) : (
                          visibleDependencyCategories.map(category => (
                            <label
                              key={category.id}
                              style={{
                                ...checkboxRowStyle,
                                background: dependencyDraft.categoryIds.includes(category.id) ? '#f3f7ff' : 'transparent'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={dependencyDraft.categoryIds.includes(category.id)}
                                onChange={event => toggleDependencyCategory(category.id, event.target.checked)}
                                style={{ margin: 0, width: 16, height: 16, flexShrink: 0 }}
                              />
                              <span style={{ flex: 1, minWidth: 0 }}>{category.name}</span>
                              {category.isActive === false ? <span className="chip warning">Inactive</span> : null}
                            </label>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8, fontSize: 13, color: '#334155', fontWeight: 600, marginTop: -2 }}>
                <input type="checkbox" checked={dependencyDraft.isActive} onChange={event => setDependencyDraft(current => ({ ...current, isActive: event.target.checked }))} />
                Keep this mapping active
              </label>
            </div>

            <div style={dependencyModalFooterStyle}>
              <button className="secondary-btn" onClick={resetDependencyEditor} disabled={saving}>Cancel</button>
              <button className="primary-btn" onClick={() => void saveDependency()} disabled={saving}>
                {editingDependencyId ? 'Update Mappings' : 'Save Mappings'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteMasterOption ? (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalCardStyle, width: 'min(680px, 100%)' }}>
            <div className="panel-head">
              <div>
                <h3 style={{ margin: 0, color: '#13233f', fontSize: 22, fontWeight: 600 }}>
                  {deleteMasterOption.masterKey === 'business_type' ? 'Delete Business Type?' : 'Delete Industry Category?'}
                </h3>
                <p className="panel-copy">
                  {deleteMasterOption.masterKey === 'business_type'
                    ? 'This will remove this Business Type from active master selections and remove its dependency mappings. Existing saved records will not be deleted.'
                    : 'This will remove this Industry Category from active master selections and remove its dependency mappings. Existing saved records will not be deleted.'}
                </p>
              </div>
              <button className="secondary-btn" onClick={closeDeleteMasterOption} disabled={saving}>Cancel</button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ border: cardBorder, borderRadius: 16, padding: 14, background: '#fcfdff' }}>
                <div style={{ fontSize: 13, color: '#5e789d', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {deleteMasterOption.masterKey === 'business_type' ? 'Business Type' : 'Industry Category'}
                </div>
                <div style={{ fontSize: 16, color: '#13233f', fontWeight: 600 }}>{deleteMasterOption.label}</div>
                <div className="muted" style={{ marginTop: 4 }}>{deleteMasterOption.value}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <div style={{ border: cardBorder, borderRadius: 14, padding: 12, background: '#fcfdff' }}>
                  <div className="muted" style={{ fontSize: 12 }}>Business Type mappings</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#13233f', marginTop: 4 }}>{deleteMasterContext.businessMappingCount}</div>
                </div>
                <div style={{ border: cardBorder, borderRadius: 14, padding: 12, background: '#fcfdff' }}>
                  <div className="muted" style={{ fontSize: 12 }}>Labour Category mappings</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#13233f', marginTop: 4 }}>{deleteMasterContext.categoryMappingCount}</div>
                </div>
                <div style={{ border: cardBorder, borderRadius: 14, padding: 12, background: '#fcfdff' }}>
                  <div className="muted" style={{ fontSize: 12 }}>Company references</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#13233f', marginTop: 4 }}>{deleteMasterContext.companyReferenceCount}</div>
                </div>
                <div style={{ border: cardBorder, borderRadius: 14, padding: 12, background: '#fcfdff' }}>
                  <div className="muted" style={{ fontSize: 12 }}>Job post references</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#13233f', marginTop: 4 }}>{deleteMasterContext.jobPostReferenceCount}</div>
                </div>
              </div>

              {(deleteMasterContext.companyReferenceCount > 0 || deleteMasterContext.jobPostReferenceCount > 0) ? (
                <div className="flash" style={{ marginBottom: 0, background: '#fff8e8', border: '1px solid #f7d68a', color: '#8a5a00' }}>
                  {deleteMasterOption.masterKey === 'business_type'
                    ? 'This Business Type is used by existing saved records. Saved records will be preserved while the master value and related mappings are removed from active use.'
                    : 'This Industry Category is used by existing saved records. Saved records will be preserved while the master value and related mappings are removed from active use.'}
                </div>
              ) : null}
            </div>

            <div className="actions" style={{ justifyContent: 'flex-end' }}>
              <button className="secondary-btn" onClick={closeDeleteMasterOption} disabled={saving}>Cancel</button>
              <button
                className="primary-btn"
                onClick={() => void confirmDeleteMasterOption()}
                disabled={saving}
                style={{ background: '#b42318', borderColor: '#b42318', color: '#ffffff' }}
              >
                {deleteMasterOption.masterKey === 'business_type' ? 'Delete Business Type' : 'Delete Industry Category'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
