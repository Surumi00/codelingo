import api from './client'

export type OnboardingAnswerKey = 'occupation' | 'experienceLevel' | 'language'

export type OnboardingAnswers = Record<OnboardingAnswerKey, string>

export function saveOnboarding(answers: OnboardingAnswers): Promise<unknown> {
  return api.post('/me/onboarding', answers).then((response) => response.data)
}
