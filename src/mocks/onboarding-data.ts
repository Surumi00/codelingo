export interface OnboardingOption {
  value: string
  label: string
  name: string
}

export interface OnboardingStep {
  title: string
  description?: string
  buttonText: string
  image: 'happy' | 'hi'
  variant?: 'welcome' | 'message' | 'project-intro' | 'learning'
  options?: OnboardingOption[]
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
    title: 'What do you want to learn?',
    buttonText: 'Start the diagnostic →',
    image: 'happy',
    variant: 'learning',
    options: [
      { value: 'PY', label: 'PY', name: 'Python' },
      { value: 'JV', label: 'JV', name: 'Java' },
      { value: 'JS', label: 'JS', name: 'JavaScript' },
    ],
  },
  {
    title:
      "First, I'll ask you 20 questions to see where you stand. Based on your results, you'll be placed at the right level — and that's where your journey begins.",
    buttonText: "I'm ready — start the test!",
    image: 'hi',
    variant: 'message',
  },
]
