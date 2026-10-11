export type SyllabusConcept = {
  id: string | number
  name: string
  title?: string
  description?: string
  slug?: string
  order?: number
}

export type SyllabusTopic = {
  id: string | number
  name: string
  title?: string
  slug?: string
  description?: string
  icon?: string | null
  order?: number
  levelId?: string | number
  concepts: SyllabusConcept[]
}

export type SyllabusLevel = {
  id: string | number
  name: string
  title?: string
  slug?: string
  description?: string
  label?: string
  order?: number
  topics: SyllabusTopic[]
}

export type DiagnosticStartingLevel = string | { id?: string | number; title?: string } | null

export type DiagnosticLikeResult = {
  startingSyllabusLevel?: DiagnosticStartingLevel
  level?: string | null
  name?: string | null
}
