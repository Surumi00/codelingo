export interface OnboardingOption {
  value: string
  label: string
  name: string
  comingSoon?: boolean
}

export interface OnboardingStep {
  title: string
  description?: string
  buttonText: string
  image: 'happy' | 'hi'
  variant?: 'welcome' | 'message' | 'project-intro' | 'learning'
  options?: OnboardingOption[]
  answerKey?: 'occupation' | 'experienceLevel' | 'language'
}

export const onboardingData: OnboardingStep[] = [
  {
    title: 'codelingo',
    description: 'learn to code for real',
    buttonText: 'Continue',
    image: 'happy',
    variant: 'welcome',
  },
  {
    title: "Hi there! I'm Purple!",
    buttonText: 'Continue',
    image: 'hi',
    variant: 'message',
  },
  {
    title:
      'CodeLingo tracks exactly which concepts in your chosen language are Weak, Developing, or Strong — starting with a quick diagnostic, not a guess.',
    buttonText: 'Continue',
    image: 'hi',
    variant: 'project-intro',
  },
  {
    title: 'What do you do?',
    buttonText: 'Continue',
    image: 'happy',
    variant: 'learning',
    answerKey: 'occupation',
    options: [
      { value: 'STUDENT', label: '🎓', name: 'Student' },
      { value: 'PROFESSIONAL', label: '💼', name: 'Professional' },
      { value: 'HOBBYIST', label: '🎮', name: 'Hobbyist' },
    ],
  },
  {
    title: 'How much coding experience do you have?',
    buttonText: 'Continue',
    image: 'happy',
    variant: 'learning',
    answerKey: 'experienceLevel',
    options: [
      { value: 'STUDENT', label: '🎒', name: 'Student' },
      { value: 'BEGINNER', label: '🌱', name: 'Beginner' },
      { value: 'SOME_EXPERIENCE', label: '💪', name: 'Some experience' },
      { value: 'EXPERIENCED', label: '🚀', name: 'Experienced' },
    ],
  },
  {
    title: 'What do you want to learn?',
    buttonText: 'Start the diagnostic →',
    image: 'happy',
    variant: 'learning',
    answerKey: 'language',
    options: [
      { value: 'PYTHON', label: 'PY', name: 'Python' },
      { value: 'JAVA', label: 'JV', name: 'Java', comingSoon: true },
      { value: 'JAVASCRIPT', label: 'JS', name: 'JavaScript', comingSoon: true },
    ],
  },
  {
    title:
      "First, I'll ask you 15 questions to see where you stand. Based on your results, you'll be placed at the right level — and that's where your journey begins.",
    buttonText: "I'm ready — start the test!",
    image: 'hi',
    variant: 'message',
  },
]