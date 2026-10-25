import { getSyllabus } from '../../../api/syllabus'
import type {
  LessonStatus,
  SyllabusConcept,
  SyllabusLesson,
  SyllabusLevel,
  SyllabusTopic,
} from '../types'

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  return undefined
}

function readId(value: unknown, fallback: string): string | number {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  return fallback
}

function readOrder(value: unknown, fallback: number): number {
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

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readLessonStatus(value: unknown): LessonStatus {
  const status = typeof value === 'string' ? value.toUpperCase() : ''

  if (status === 'AVAILABLE' || status === 'COMPLETED') {
    return status
  }

  return 'LOCKED'
}

function normalizeLesson(rawLesson: unknown, fallbackId: string): SyllabusLesson | null {
  if (!rawLesson || typeof rawLesson !== 'object') {
    return null
  }

  const record = rawLesson as Record<string, unknown>
  const title = readString(record.title) ?? readString(record.name)

  if (!title) {
    return null
  }

  return {
    id: readId(record.id, fallbackId),
    title,
    order: readOrder(record.order, 0),
    xpReward: readOrder(record.xpReward, 10),
    status: readLessonStatus(record.status),
  }
}

function normalizeLessons(rawLessons: unknown, conceptId: string): SyllabusLesson[] {
  return asArray(rawLessons)
    .map((lesson, index) => normalizeLesson(lesson, `${conceptId}-lesson-${index}`))
    .filter((lesson): lesson is SyllabusLesson => lesson !== null)
    .sort((left, right) => left.order - right.order)
}

function normalizeConcept(rawConcept: unknown, fallbackId: string): SyllabusConcept | null {
  if (!rawConcept || typeof rawConcept !== 'object') {
    return null
  }

  const record = rawConcept as Record<string, unknown>
  const name = readString(record.title) ?? readString(record.name) ?? readString(record.conceptSlug)

  if (!name) {
    return null
  }

  const conceptId = readId(record.id, fallbackId)

  return {
    id: conceptId,
    name,
    title: readString(record.title) ?? name,
    description: readString(record.description),
    slug: readString(record.conceptSlug) ?? readString(record.slug),
    lessons: normalizeLessons(record.lessons, String(conceptId)),
  }
}

function normalizeConcepts(rawConcepts: unknown, topicId: string): SyllabusConcept[] {
  return asArray(rawConcepts)
    .map((concept, index) => normalizeConcept(concept, `${topicId}-concept-${index}`))
    .filter((concept): concept is SyllabusConcept => concept !== null)
}

function normalizeTopic(rawTopic: unknown, fallbackIndex: number, levelId: string | number): SyllabusTopic | null {
  if (!rawTopic || typeof rawTopic !== 'object') {
    return null
  }

  const record = rawTopic as Record<string, unknown>
  const name = readString(record.title) ?? readString(record.name) ?? readString(record.slug)

  if (!name) {
    return null
  }

  const topicId = String(readId(record.id, `${String(levelId)}-topic-${fallbackIndex}`))

  return {
    id: readId(record.id, topicId),
    name,
    title: readString(record.title) ?? name,
    slug: readString(record.slug),
    description: readString(record.blurb) ?? readString(record.description),
    icon: typeof record.icon === 'string' ? record.icon : undefined,
    order: readOrder(record.order, fallbackIndex),
    levelId,
    concepts: normalizeConcepts(record.concepts, topicId),
  }
}

function normalizeTopics(rawTopics: unknown, levelId: string | number): SyllabusTopic[] {
  return asArray(rawTopics)
    .map((topic, index) => normalizeTopic(topic, index, levelId))
    .filter((topic): topic is SyllabusTopic => topic !== null)
}

function normalizeLevel(rawLevel: unknown, fallbackIndex: number): SyllabusLevel | null {
  if (!rawLevel || typeof rawLevel !== 'object') {
    return null
  }

  const record = rawLevel as Record<string, unknown>
  const name = readString(record.title) ?? readString(record.name) ?? readString(record.label)

  if (!name) {
    return null
  }

  const levelId = readId(record.id, `level-${fallbackIndex}`)

  return {
    id: levelId,
    name,
    title: readString(record.title) ?? name,
    slug: readString(record.slug),
    description: readString(record.description),
    label: readString(record.label) ?? name,
    order: readOrder(record.order, fallbackIndex),
    topics: normalizeTopics(record.topics, levelId),
  }
}

function extractLevels(payload: unknown): SyllabusLevel[] {
  const collection = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)
      ? ((payload as { data: unknown[] }).data)
      : []

  return collection
    .map((level, index) => normalizeLevel(level, index))
    .filter((level): level is SyllabusLevel => level !== null)
}

export async function getSyllabusLevels(): Promise<SyllabusLevel[]> {
  const payload = await getSyllabus()

  return extractLevels(payload)
}
