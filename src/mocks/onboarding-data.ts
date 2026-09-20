export interface OnboardingStep {
  title: string
  description: string
  buttonText: string
  image: string
  isMessage?: boolean
}

export const onboardingData: OnboardingStep[] = [
  {
    title: "codelingo",
    description: "learn to code for real",
    buttonText: "Continue",
    image: "happy",
  },
  {
    title: "Hi there! I'm Purple!",
    description: "",
    buttonText: "Continue",
    image: "hi",
    isMessage: true,
  },
  {
    title: "Welcome to CodeLingo!",
    description:
      "Learn programming languages step by step, practice by writing real code, complete challenges, and track your progress from A1 Beginner to C2 Expert.",
    buttonText: "Let's start coding!",
    image: "hi",
  },
]
 