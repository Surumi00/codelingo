import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { onboardingData, type OnboardingStep } from "../../../mocks/onboarding-data";
import happyCharacter from "../../../assets/characters/happy.png";
import hiCharacter from "../../../assets/characters/hi.png";

export function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();

    const step: OnboardingStep = onboardingData[currentStep];

    const getCharacterImage = (): string => {
        if (step.image === "happy") {
            return happyCharacter;
        }
        return hiCharacter;
    };

    const handleButtonClick = () => {
        if (currentStep < onboardingData.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Navigate to home/dashboard after onboarding
            navigate({ to: "." });
        }
    };

    return (
        <div
            className="flex min-h-screen w-full items-center justify-center bg-black px-4 py-8"
            style={{
                backgroundImage: `
          radial-gradient(circle at 11% 12%, rgba(111, 57, 202, 0.8), transparent 31%),
          radial-gradient(circle at 39% 99%, rgba(109, 49, 65, 0.3), transparent 18%)
        `,
            }}
        >
            <div className="w-full max-w-md flex flex-col items-center text-center">
                {/* Mascot */}
                <img
                    src={getCharacterImage()}
                    alt="CodeLingo character Purple"
                    className="mb-6 h-32 w-32 shrink-0 object-contain"
                />

                {/* Step 1 & 3: Title + Subtitle/Description */}
                {!step.isMessage && (
                    <>
                        <h1 className="mb-2 text-4xl font-bold text-white md:text-5xl">{step.title}</h1>
                        {step.description && (
                            <p className="mb-8 text-base text-gray-300 md:text-lg">{step.description}</p>
                        )}
                    </>
                )}

                {/* Step 2: Speech Bubble */}
                {step.isMessage && (
                    <div className="mb-8 flex flex-col items-center">
                        {/* Bubble */}
                        <div className="inline-block rounded-3xl border border-purple-500 border-opacity-40 bg-gray-900 bg-opacity-80 px-7 py-4 backdrop-blur-sm">
                            <p className="m-0 text-lg font-semibold text-white md:text-xl">{step.title}</p>
                        </div>
                        {/* Bubble pointer */}
                        <div
                            className="h-0 w-0"
                            style={{
                                borderLeft: "12px solid transparent",
                                borderRight: "12px solid transparent",
                                borderTop: "12px solid rgb(17, 24, 39)",
                                marginTop: "4px",
                            }}
                        />
                    </div>
                )}

                {/* Button */}
                <button
                    onClick={handleButtonClick}
                    type="button"
                    className="mb-6 h-14 w-full max-w-xs rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 text-base font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-purple-600 md:text-lg"
                >
                    {step.buttonText}
                </button>

                {/* Progress Indicators */}
                <div className="flex items-center justify-center gap-4">
                    {onboardingData.map((_, index) => (
                        <div
                            key={index}
                            className={`transition-all duration-300 ${
                                index === currentStep
                                    ? "h-3 w-9 rounded-full bg-gradient-to-r from-purple-600 to-purple-700"
                                    : "h-3 w-3 rounded-full bg-purple-600 bg-opacity-40 hover:bg-opacity-60"
                            }`}
                            aria-current={index === currentStep ? "step" : undefined}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
