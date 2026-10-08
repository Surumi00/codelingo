export type SyllabusTopic = {
  id: string | number
  name: string
  title?: string
  slug?: string
  description?: string
  icon?: string | null
  order?: number
  levelId?: string | number
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

export type DiagnosticLikeResult = {
  startingSyllabusLevel?: string | null
  level?: string | null
  name?: string | null
}
