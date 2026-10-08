import axios from 'axios'
import type { SyllabusLevel, SyllabusTopic } from '../types'

const endpointCandidates = [
  '/syllabus/levels',
  '/syllabus',
  '/api/syllabus/levels',
  '/api/syllabus',
]

function pickFirstString(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return undefined
}

function safeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function normalizeId(value: unknown, fallback: string | number): string | number {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  return fallback
}

function normalizeTopic(rawTopic: unknown, fallbackIndex: number, levelId: string | number): SyllabusTopic | null {
  if (!rawTopic || typeof rawTopic !== 'object') {
    return null
  }

  const record = rawTopic as Record<string, unknown>
  const name = pickFirstString(
    record.name,
    record.title,
    record.label,
    record.slug,
    record.topicName,
    record.conceptName,
  )

  if (!name) {
    return null
  }

  return {
    id: normalizeId(record.id ?? record.slug ?? `${String(levelId)}-${fallbackIndex}`, `${String(levelId)}-${fallbackIndex}`),
    name,
    title: pickFirstString(record.title, record.name, record.label) ?? name,
    slug: pickFirstString(record.slug, record.key) ?? undefined,
    description: pickFirstString(record.description, record.summary) ?? undefined,
    icon: typeof record.icon === 'string' ? record.icon : undefined,
    order: safeNumber(record.order ?? record.position ?? record.sortOrder, fallbackIndex),
    levelId,
  }
}

function normalizeTopics(rawTopics: unknown, levelId: string | number): SyllabusTopic[] {
  if (!rawTopics) {
    return []
  }

  const asArray = Array.isArray(rawTopics)
    ? rawTopics
    : Array.isArray((rawTopics as { items?: unknown[] } | undefined)?.items)
      ? (rawTopics as { items: unknown[] }).items
      : Array.isArray((rawTopics as { topics?: unknown[] } | undefined)?.topics)
        ? (rawTopics as { topics: unknown[] }).topics
        : []

  return asArray
    .map((topic, index) => normalizeTopic(topic, index, levelId))
    .filter((topic): topic is SyllabusTopic => topic !== null)
}

function normalizeLevel(rawLevel: unknown, fallbackIndex: number): SyllabusLevel | null {
  if (!rawLevel || typeof rawLevel !== 'object') {
    return null
  }

  const record = rawLevel as Record<string, unknown>
  const name = pickFirstString(
    record.name,
    record.title,
    record.label,
    record.levelName,
    record.topicName,
  )

  if (!name) {
    return null
  }

  const levelId = normalizeId(record.id ?? record.slug ?? record.levelId ?? `level-${fallbackIndex}`, `level-${fallbackIndex}`)
  const topics = normalizeTopics(
    record.topics ?? record.items ?? record.concepts ?? record.modules ?? record.lessons,
    levelId,
  )

  return {
    id: levelId,
    name,
    title: pickFirstString(record.title, record.name, record.label) ?? name,
    slug: pickFirstString(record.slug, record.key) ?? undefined,
    description: pickFirstString(record.description, record.summary, record.subtitle) ?? undefined,
    label: pickFirstString(record.label, record.name) ?? name,
    order: safeNumber(record.order ?? record.position ?? record.levelOrder, fallbackIndex),
    topics,
  }
}

function extractLevels(payload: unknown): SyllabusLevel[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => normalizeLevel(item, index))
      .filter((item): item is SyllabusLevel => item !== null)
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>

  const candidateCollections = [
    record.levels,
    record.items,
    record.data,
    record.result,
    record.syllabus,
    record.rows,
    record.entries,
  ]

  for (const candidate of candidateCollections) {
    if (Array.isArray(candidate)) {
      const levels = candidate
        .map((level, index) => normalizeLevel(level, index))
        .filter((level): level is SyllabusLevel => level !== null)

      if (levels.length > 0) {
        return levels
      }
    }

    if (candidate && typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>
      const nestedLevels = nested.levels
      if (Array.isArray(nestedLevels)) {
        const levels = nestedLevels
          .map((level, index) => normalizeLevel(level, index))
          .filter((level): level is SyllabusLevel => level !== null)

        if (levels.length > 0) {
          return levels
        }
      }
    }
  }

  const topLevel = normalizeLevel(payload, 0)
  return topLevel ? [topLevel] : []
}

export async function getSyllabusLevels(): Promise<SyllabusLevel[]> {
  const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined

  let lastError: unknown

  for (const endpoint of endpointCandidates) {
    try {
      const response = await axios.get<unknown>(`http://localhost:3000${endpoint}`, { headers })
      const levels = extractLevels(response.data)

      if (levels.length > 0) {
        return levels
      }
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new Error('Unable to load the syllabus.')
}
