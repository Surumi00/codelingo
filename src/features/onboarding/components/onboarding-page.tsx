import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { onboardingData, type OnboardingStep } from "../../../mocks/onboarding-data";
import happyCharacter from "../../../assets/characters/happy.png";
import hiCharacter from "../../../assets/characters/hi.png";

const characterAssets = {
  happy: happyCharacter,
  hi: hiCharacter,
} as const

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState('PY')
  const navigate = useNavigate()

    const step: OnboardingStep = onboardingData[currentStep];

  const getCharacterImage = (): string => characterAssets[step.image]

  const handleButtonClick = () => {
    if (currentStep < onboardingData.length - 1) {
      setCurrentStep((previousStep) => previousStep + 1)
      return
    }

    navigate({ to: '/profile' })
  }

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center px-4 py-8"
      style={{
        background:
          'radial-gradient(circle at 12% 12%, rgba(147, 96, 231, 0.85), transparent 28%), var(--bg)',
      }}
    >
      <div className="w-full max-w-[700px]">
        {step.variant === 'learning' && (
          <div className="flex flex-col items-center justify-center text-center">
            <img
              src={getCharacterImage()}
              alt="CodeLingo character"
              className="mb-4 h-28 w-28 object-contain md:h-32 md:w-32"
            />

            <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">
              {step.title}
            </h1>

            <div className="grid w-full max-w-[460px] grid-cols-3 gap-4">
              {step.options?.map((option) => {
                const isSelected = selectedLanguage === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedLanguage(option.value)}
                    className={`flex min-h-[140px] flex-col items-center justify-center rounded-[18px] border text-center transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-300 bg-gradient-to-b from-purple-400/95 to-purple-500/70 shadow-[0_0_25px_rgba(168,114,255,0.4)]'
                        : 'border-[#4b415c] bg-[#1f1d29]/80 text-white/90 hover:border-purple-400/70'
                    }`}
                  >
                    <span className="mb-3 text-3xl font-extrabold tracking-wide text-white">
                      {option.label}
                    </span>
                    <span className="text-lg font-medium text-white/90">
                      {option.name}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleButtonClick}
              className="mt-4 h-16 w-full max-w-[460px] rounded-[18px] bg-gradient-to-r from-purple-500 to-purple-600 px-6 text-lg font-bold text-white shadow-[0_18px_32px_rgba(123,74,212,0.35)] transition-all duration-300 hover:brightness-110 active:scale-[0.99]"
            >
              {step.buttonText}
            </button>
          </div>
        )}

        {(step.variant === 'message' || step.variant === 'project-intro') && (
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-6 flex w-full justify-center">
              <div className="relative max-w-[430px] rounded-[24px] border border-[#5b5668] bg-[#3b3944]/90 px-6 py-5 shadow-[0_20px_30px_rgba(21,11,33,0.45)]">
                <p className="m-0 text-lg font-semibold leading-relaxed text-white md:text-[1.15rem]">
                  {step.title}
                </p>
              </div>
              <div className="absolute -bottom-4 left-32 h-5 w-5 rotate-45 rounded-sm bg-[#3b3944]/90" />
            </div>

            <div className="relative mb-2 flex h-28 w-28 items-center justify-center">
              <span className="absolute -left-14 top-2 h-2.5 w-2.5 rounded-full bg-[#d8b4fe] opacity-80" />
              <span className="absolute -left-5 top-7 h-2 w-2 rounded-full bg-[#f4c27c] opacity-80" />
              <span className="absolute left-10 top-0 h-2 w-2 rounded-full bg-[#d8b4fe] opacity-80" />
              <span className="absolute -right-7 top-9 h-1.5 w-1.5 rounded-full bg-[#f7c36a] opacity-80" />
              <img
                src={getCharacterImage()}
                alt="CodeLingo character"
                className="h-full w-full object-contain"
              />
            </div>

            <button
              type="button"
              onClick={handleButtonClick}
              className="mt-4 h-16 w-full max-w-[520px] rounded-[18px] bg-gradient-to-r from-purple-500 to-purple-600 px-6 text-lg font-bold text-white shadow-[0_18px_32px_rgba(123,74,212,0.35)] transition-all duration-300 hover:brightness-110 active:scale-[0.99]"
            >
              {step.buttonText}
            </button>
          </div>
        )}

        {step.variant === 'welcome' && (
          <div className="flex flex-col items-center justify-center text-center">
            <img
              src={getCharacterImage()}
              alt="CodeLingo character"
              className="mb-4 h-28 w-28 object-contain md:h-32 md:w-32"
            />

            <h1 className="mb-2 text-4xl font-bold text-white md:text-5xl">
              {step.title}
            </h1>

            {step.description && (
              <p className="mb-6 text-lg text-gray-300 md:text-xl">
                {step.description}
              </p>
            )}

            <button
              type="button"
              onClick={handleButtonClick}
              className="h-14 w-full max-w-[220px] rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 text-base font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
            >
              {step.buttonText}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
