import type {
  CheckExerciseResponse,
  ExerciseAnswer,
  LessonExercise,
} from '../../api/lessons'

export type ExerciseComponentProps = {
  exercise: LessonExercise
  disabled: boolean
  result: CheckExerciseResponse | null
  onAnswerChange: (answer: ExerciseAnswer | null) => void
}
