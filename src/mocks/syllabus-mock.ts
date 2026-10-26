/**
 * Mock syllabus for the two-week demo account. The first six lessons are
 * completed, lesson seven is available (the next one to start), and the rest
 * are locked. The lesson statuses line up with `completedLessonIds` in the
 * progress mock so the syllabus and progress page stay consistent.
 */
const COMPLETED = 'COMPLETED'
const AVAILABLE = 'AVAILABLE'
const LOCKED = 'LOCKED'

export const DEMO_SYLLABUS = {
  levels: [
    {
      id: 'level-1',
      title: 'Python Fundamentals',
      label: 'Level 1',
      description: 'Start here',
      order: 1,
      topics: [
        {
          id: 'topic-1',
          name: 'Variables & Input',
          order: 1,
          concepts: [
            {
              id: 'concept-1',
              name: 'Variables',
              slug: 'variables',
              order: 1,
              lessons: [
                {
                  id: 'python-fundamentals-1',
                  title: 'Your First Print',
                  order: 1,
                  xpReward: 20,
                  status: COMPLETED,
                },
                {
                  id: 'python-fundamentals-2',
                  title: 'Variables & Types',
                  order: 2,
                  xpReward: 25,
                  status: COMPLETED,
                },
              ],
            },
            {
              id: 'concept-2',
              name: 'User Input',
              slug: 'user-input',
              order: 2,
              lessons: [
                {
                  id: 'python-fundamentals-3',
                  title: 'Getting User Input',
                  order: 1,
                  xpReward: 20,
                  status: COMPLETED,
                },
                {
                  id: 'python-fundamentals-4',
                  title: 'Type Conversion',
                  order: 2,
                  xpReward: 25,
                  status: COMPLETED,
                },
              ],
            },
          ],
        },
        {
          id: 'topic-2',
          name: 'Control Flow',
          order: 2,
          concepts: [
            {
              id: 'concept-3',
              name: 'Conditionals',
              slug: 'conditionals',
              order: 1,
              lessons: [
                {
                  id: 'python-fundamentals-5',
                  title: 'If Statements',
                  order: 1,
                  xpReward: 30,
                  status: COMPLETED,
                },
                {
                  id: 'python-fundamentals-6',
                  title: 'Else If (Elif)',
                  order: 2,
                  xpReward: 30,
                  status: COMPLETED,
                },
                {
                  id: 'python-fundamentals-7',
                  title: 'Comparison Operators',
                  order: 3,
                  xpReward: 30,
                  status: AVAILABLE,
                },
                {
                  id: 'python-fundamentals-8',
                  title: 'Logical Operators',
                  order: 4,
                  xpReward: 30,
                  status: LOCKED,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Working with Data',
      label: 'Level 2',
      description: 'Lists, loops, and functions',
      order: 2,
      topics: [
        {
          id: 'topic-3',
          name: 'Lists & Loops',
          order: 1,
          concepts: [
            {
              id: 'concept-4',
              name: 'Lists',
              slug: 'lists',
              order: 1,
              lessons: [
                {
                  id: 'python-fundamentals-9',
                  title: 'Lists',
                  order: 1,
                  xpReward: 35,
                  status: LOCKED,
                },
                {
                  id: 'python-fundamentals-10',
                  title: 'Looping Over Lists',
                  order: 2,
                  xpReward: 35,
                  status: LOCKED,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export async function mockGetSyllabus(): Promise<typeof DEMO_SYLLABUS> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  return { ...DEMO_SYLLABUS }
}
