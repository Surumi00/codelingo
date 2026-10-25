import type {
  CheckExerciseResponse,
  CompleteLessonResponse,
  ExerciseAnswer,
  LessonDetail,
  StartLessonResponse,
  UserProgress,
} from '../api/lessons'

const MOCK_LESSON_ID = 'mock-lesson-1'
const MOCK_SESSION_ID = 'mock-session-1'
const MOCK_XP_REWARD = 20

const delay = (ms = 120) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * A self-contained lesson used when VITE_USE_MOCK=true, so the player can be
 * built and demoed before the backend endpoints are live. The payload shapes
 * mirror the API contract exactly.
 */
const mockLesson: LessonDetail = {
  id: MOCK_LESSON_ID,
  title: 'Printing, Input & Variables',
  xpReward: MOCK_XP_REWARD,
  exercises: [
    {
      id: 'mock-ex-1',
      order: 1,
      type: 'MULTIPLE_CHOICE',
      prompt: 'Which line prints exactly: Hello, world!',
      options: [
        'print("Hello, world!")',
        "print('Hello, world!)",
        'Print("Hello, world!")',
        'print(Hello, world!)',
      ],
    },
    {
      id: 'mock-ex-2',
      order: 2,
      type: 'PREDICT_OUTPUT',
      prompt: 'What does this program print?',
      code: 'name = "Ada"\nprint("Hi, " + name)',
      options: ['Hi, Ada', 'Hi, name', 'Ada', 'Hi, + Ada'],
    },
    {
      id: 'mock-ex-3',
      order: 3,
      type: 'FIX_BUG',
      prompt: 'This program crashes with a TypeError. Which line fixes it?',
      code: 'age = input("Age: ")\nnext_age = age + 1\nprint(next_age)',
      options: [
        'next_age = int(age) + 1',
        'next_age = str(age) + 1',
        'next_age = age + "1"',
        'next_age = int(age + 1)',
      ],
    },
    {
      id: 'mock-ex-4',
      order: 4,
      type: 'FILL_BLANK',
      prompt: 'Complete the loop so it prints 0, 1, 2, 3 and 4.',
      template: 'for i in {{b1}}({{b2}}):\n    print(i)',
      bank: ['range', '5', 'while', 'print'],
    },
    {
      id: 'mock-ex-5',
      order: 5,
      type: 'ARRANGE_LINES',
      prompt: 'Arrange the lines to ask for a name and greet the user.',
      // The real API returns a shuffled order; this one deliberately is not
      // the correct order either.
      lines: [
        { id: 'line-3', text: 'print(greeting)' },
        { id: 'line-1', text: 'name = input("Your name: ")' },
        { id: 'line-2', text: 'greeting = "Hello, " + name' },
      ],
    },
    {
      id: 'mock-ex-6',
      order: 6,
      type: 'MULTIPLE_CHOICE',
      prompt: 'Which variable name is valid in Python?',
      options: ['total_score', 'total score', '2total', 'total-score'],
    },
    {
      id: 'mock-ex-7',
      order: 7,
      type: 'WRITE_CODE',
      prompt: 'Write a function add(a, b) that returns the sum of two numbers.',
      starterCode: 'def add(a, b):\n    # Return the sum of a and b\n    pass\n',
      functionName: 'add',
      tests: [
        { input: [2, 3], expected: 5 },
        { input: [-4, 1], expected: -3 },
        { input: [0, 0], expected: 0 },
      ],
    },
  ],
}

type AnswerKey =
  | { kind: 'choice'; correctIndex: number; explanation: string }
  | {
      kind: 'blanks'
      accepted: Record<string, string[]>
      explanation: string
    }
  | { kind: 'order'; correctOrder: string[]; explanation: string }
  | { kind: 'code'; solution: string; explanation: string }

const answerKeys: Record<string, AnswerKey> = {
  'mock-ex-1': {
    kind: 'choice',
    correctIndex: 0,
    explanation:
      'print() is lowercase, and the string needs matching quotes around all of the text.',
  },
  'mock-ex-2': {
    kind: 'choice',
    correctIndex: 0,
    explanation:
      'name holds "Ada", so "Hi, " + name builds the string "Hi, Ada" before printing it.',
  },
  'mock-ex-3': {
    kind: 'choice',
    correctIndex: 0,
    explanation:
      'input() always returns a string. Convert it to an int before doing arithmetic, otherwise Python raises a TypeError.',
  },
  'mock-ex-4': {
    kind: 'blanks',
    accepted: {
      b1: ['range'],
      b2: ['5', 'range(5)'],
    },
    explanation: 'range(5) produces 0, 1, 2, 3 and 4, so the loop prints all five numbers.',
  },
  'mock-ex-5': {
    kind: 'order',
    correctOrder: ['line-1', 'line-2', 'line-3'],
    explanation:
      'Ask for the name first, build the greeting from it, then print the finished greeting.',
  },
  'mock-ex-6': {
    kind: 'choice',
    correctIndex: 0,
    explanation:
      'Variable names may use letters, digits and underscores, but cannot contain spaces, start with a digit, or use dashes.',
  },
  'mock-ex-7': {
    kind: 'code',
    solution: 'def add(a, b):\n    return a + b',
    explanation:
      'A function returns its result with return. Without it the call evaluates to None, so add(2, 3) would not equal 5.',
  },
}

// sessionId -> exerciseId -> whether the first attempt was correct.
const firstAttemptsBySession = new Map<string, Map<string, boolean>>()

function attemptsFor(sessionId: string): Map<string, boolean> {
  const existing = firstAttemptsBySession.get(sessionId)

  if (existing) {
    return existing
  }

  const fresh = new Map<string, boolean>()
  firstAttemptsBySession.set(sessionId, fresh)

  return fresh
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function correctAnswerFor(exerciseId: string): ExerciseAnswer {
  const key = answerKeys[exerciseId]

  if (key.kind === 'choice') {
    return { selectedIndex: key.correctIndex }
  }

  if (key.kind === 'blanks') {
    const blanks: Record<string, string> = {}

    for (const [blank, accepted] of Object.entries(key.accepted)) {
      blanks[blank] = accepted[0] ?? ''
    }

    return { blanks }
  }

  if (key.kind === 'code') {
    return { code: key.solution, passed: true }
  }

  return { order: key.correctOrder }
}

function isCorrect(exerciseId: string, answer: ExerciseAnswer): boolean {
  const key = answerKeys[exerciseId]

  if (key.kind === 'choice') {
    return 'selectedIndex' in answer && answer.selectedIndex === key.correctIndex
  }

  if (key.kind === 'blanks') {
    if (!('blanks' in answer)) {
      return false
    }

    return Object.entries(key.accepted).every(([blank, accepted]) => {
      const submitted = answer.blanks[blank]

      return (
        typeof submitted === 'string' &&
        accepted.some((option) => normalize(option) === normalize(submitted))
      )
    })
  }

  if (key.kind === 'code') {
    return 'passed' in answer && answer.passed === true
  }

  return 'order' in answer && answer.order.join('|') === key.correctOrder.join('|')
}

export async function mockGetLesson(lessonId: string): Promise<LessonDetail> {
  await delay()

  if (lessonId !== MOCK_LESSON_ID) {
    throw new Error('Lesson not found')
  }

  return structuredClone(mockLesson)
}

export async function mockStartLesson(lessonId: string): Promise<StartLessonResponse> {
  await delay(80)

  if (lessonId !== MOCK_LESSON_ID) {
    throw new Error('Lesson not found')
  }

  firstAttemptsBySession.delete(MOCK_SESSION_ID)

  return { sessionId: MOCK_SESSION_ID }
}

export async function mockCheckExercise(
  exerciseId: string,
  sessionId: string,
  answer: ExerciseAnswer,
): Promise<CheckExerciseResponse> {
  await delay(80)

  const key = answerKeys[exerciseId]

  if (!key) {
    throw new Error('Exercise not found')
  }

  const attempts = attemptsFor(sessionId)
  const correct = isCorrect(exerciseId, answer)

  if (!attempts.has(exerciseId)) {
    attempts.set(exerciseId, correct)
  }

  return {
    correct,
    explanation: key.explanation,
    ...(correct ? {} : { correctAnswer: correctAnswerFor(exerciseId) }),
  }
}

export async function mockCompleteLesson(
  lessonId: string,
  sessionId: string,
): Promise<CompleteLessonResponse> {
  await delay(160)

  if (lessonId !== MOCK_LESSON_ID) {
    throw new Error('Lesson not found')
  }

  const attempts = attemptsFor(sessionId)
  const firstTryCorrect = mockLesson.exercises.filter(
    (exercise) => attempts.get(exercise.id) === true,
  ).length
  const accuracy = firstTryCorrect / mockLesson.exercises.length

  return {
    xpGained: MOCK_XP_REWARD + (accuracy === 1 ? 5 : 0),
    accuracy,
    streak: { current: 4, longest: 9 },
    newlyUnlocked: [
      { id: 'mock-lesson-2', title: 'Working with Strings' },
      { id: 'mock-lesson-3', title: 'Making Decisions' },
    ],
  }
}

export async function mockGetProgress(): Promise<UserProgress> {
  await delay(60)

  return {
    totalXp: 145,
    currentStreak: 4,
    longestStreak: 9,
    completedLessonIds: [],
  }
}
