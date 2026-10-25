import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import pyodideWorkerSource from './pyodide-worker.js?raw'
import type { CodeTest } from '../../../api/lessons'
import type { ExerciseComponentProps } from '../types'

/** A runaway loop blocks the worker; give up and replace it after this long. */
const RUN_TIMEOUT_MS = 3000

type PythonState = 'loading' | 'ready' | 'error'

type RawTestResult = {
  index: number
  ok: boolean
  value: unknown
  error: string | null
}

type WorkerReply =
  | { type: 'ready' }
  | { type: 'load-error'; message: string }
  | { type: 'result'; id: number; results: RawTestResult[] }
  | { type: 'run-error'; id: number; message: string }

export type CodeTestResult = {
  index: number
  input: unknown[]
  expected: unknown
  actual: unknown
  passes: boolean
  error: string | null
}

type PendingRun = {
  id: number
  code: string
  tests: CodeTest[]
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true
  }

  if (left === null || right === null || typeof left !== typeof right) {
    return false
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false
    }

    return left.every((item, index) => deepEqual(item, right[index]))
  }

  if (typeof left === 'object') {
    const leftRecord = left as Record<string, unknown>
    const rightRecord = right as Record<string, unknown>
    const leftKeys = Object.keys(leftRecord)

    if (leftKeys.length !== Object.keys(rightRecord).length) {
      return false
    }

    return leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(rightRecord, key) &&
        deepEqual(leftRecord[key], rightRecord[key]),
    )
  }

  return false
}

function formatValue(value: unknown): string {
  if (value === undefined) {
    return 'nothing'
  }

  if (typeof value === 'string') {
    return JSON.stringify(value)
  }

  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

function formatCall(functionName: string, input: unknown[]): string {
  return `${functionName || 'solution'}(${input.map((value) => formatValue(value)).join(', ')})`
}

export function WriteCodeExercise({
  exercise,
  disabled,
  onAnswerChange,
}: ExerciseComponentProps) {
  const starterCode = (exercise.starterCode ?? '').replace(/\r\n/g, '\n')
  const functionName = exercise.functionName ?? ''
  const tests = exercise.tests ?? []

  const [code, setCode] = useState(starterCode)
  const [pythonState, setPythonState] = useState<PythonState>('loading')
  const [pythonError, setPythonError] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState('')
  const [testResults, setTestResults] = useState<CodeTestResult[] | null>(null)

  const workerRef = useRef<Worker | null>(null)
  const workerUrlRef = useRef<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const pendingRef = useRef<PendingRun | null>(null)
  const requestIdRef = useRef(0)
  const codeRef = useRef(starterCode)
  const onAnswerChangeRef = useRef(onAnswerChange)

  useEffect(() => {
    onAnswerChangeRef.current = onAnswerChange
  }, [onAnswerChange])

  const startWorker = useCallback(() => {
    if (!workerUrlRef.current) {
      workerUrlRef.current = URL.createObjectURL(
        new Blob([pyodideWorkerSource], { type: 'text/javascript' }),
      )
    }

    const worker = new Worker(workerUrlRef.current)
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data

      if (reply.type === 'ready') {
        setPythonState('ready')
        return
      }

      if (reply.type === 'load-error') {
        setPythonState('error')
        setPythonError(reply.message || 'Python could not be loaded.')
        return
      }

      const pending = pendingRef.current

      if (!pending || pending.id !== reply.id) {
        return
      }

      pendingRef.current = null

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }

      setIsRunning(false)

      // The editor was edited while Python was running; these results no
      // longer describe the code on screen.
      if (codeRef.current !== pending.code) {
        onAnswerChangeRef.current(null)
        return
      }

      if (reply.type === 'run-error') {
        setTestResults(null)
        setRunError(reply.message || 'Python could not run that code.')
        onAnswerChangeRef.current(null)
        return
      }

      const results: CodeTestResult[] = pending.tests.map((test, index) => {
        const raw = reply.results.find((entry) => entry.index === index) ?? null
        const actual = raw?.ok ? raw.value : undefined

        return {
          index,
          input: test.input,
          expected: test.expected,
          actual,
          passes: raw?.ok === true && deepEqual(actual, test.expected),
          error: raw === null ? 'The test did not run.' : raw.error,
        }
      })

      setTestResults(results)
      setRunError('')
      onAnswerChangeRef.current({
        code: pending.code,
        passed: results.length > 0 && results.every((entry) => entry.passes),
      })
    }

    worker.postMessage({ type: 'init' })
  }, [])

  useEffect(() => {
    startWorker()

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }

      pendingRef.current = null
      workerRef.current?.terminate()
      workerRef.current = null

      if (workerUrlRef.current) {
        URL.revokeObjectURL(workerUrlRef.current)
        workerUrlRef.current = null
      }
    }
  }, [startWorker])

  const updateCode = (nextCode: string) => {
    codeRef.current = nextCode
    setCode(nextCode)
    setRunError('')

    if (testResults) {
      setTestResults(null)
      onAnswerChangeRef.current(null)
    }
  }

  const runTests = () => {
    const worker = workerRef.current

    if (
      !worker ||
      disabled ||
      isRunning ||
      pythonState !== 'ready' ||
      tests.length === 0 ||
      functionName === ''
    ) {
      return
    }

    const id = requestIdRef.current + 1
    requestIdRef.current = id
    pendingRef.current = { id, code, tests }

    setIsRunning(true)
    setRunError('')

    worker.postMessage({ type: 'run', id, code, functionName, tests })

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      pendingRef.current = null

      workerRef.current?.terminate()
      workerRef.current = null

      setIsRunning(false)
      setTestResults(null)
      setPythonState('loading')
      setPythonError('')
      setRunError('Time limit exceeded (possible infinite loop)')
      onAnswerChangeRef.current(null)

      startWorker()
    }, RUN_TIMEOUT_MS)
  }

  const handleEditorKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      runTests()
      return
    }

    if (event.key !== 'Tab' || event.shiftKey || disabled) {
      return
    }

    event.preventDefault()

    const textarea = event.currentTarget
    const { selectionStart, selectionEnd, value } = textarea
    const nextCode = `${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`

    updateCode(nextCode)

    window.requestAnimationFrame(() => {
      textarea.selectionStart = selectionStart + 4
      textarea.selectionEnd = selectionStart + 4
    })
  }

  const passedCount = testResults?.filter((entry) => entry.passes).length ?? 0
  const canRun = !disabled && !isRunning && pythonState === 'ready' && tests.length > 0

  let status = 'Run the tests to check your answer.'

  if (pythonState === 'loading') {
    status = 'Loading Python…'
  } else if (pythonState === 'error') {
    status = 'Python could not be loaded. Check your connection and reopen this exercise.'
  } else if (isRunning) {
    status = 'Running your code…'
  } else if (testResults && testResults.length > 0) {
    status = `${passedCount} of ${testResults.length} tests passed.`
  }

  return (
    <div className="write-code">
      <div className="write-code-editor">
        <div className="write-code-editor-bar">
          <span className="write-code-editor-title">Python</span>
          <span className="write-code-editor-hint">Tab indents · Ctrl+Enter runs</span>
        </div>
        <textarea
          className="write-code-textarea"
          aria-label="Python code editor"
          value={code}
          rows={10}
          wrap="off"
          spellCheck={false}
          disabled={disabled}
          data-enter-ignore
          onChange={(event) => updateCode(event.target.value)}
          onKeyDown={handleEditorKeyDown}
        />
      </div>

      <div className="write-code-actions">
        <button
          type="button"
          className="write-code-run"
          data-enter-ignore
          disabled={!canRun}
          onClick={runTests}
        >
          {isRunning ? 'Running tests…' : 'Run tests'}
        </button>
        <p className="write-code-status" role="status" aria-live="polite">
          {status}
        </p>
      </div>

      {pythonState === 'error' && pythonError ? (
        <p className="write-code-run-error" role="alert">
          {pythonError}
        </p>
      ) : null}

      {runError ? (
        <p className="write-code-run-error" role="alert">
          {runError}
        </p>
      ) : null}

      {testResults ? (
        <ul className="write-code-results" aria-label="Test results">
          {testResults.map((entry) => (
            <li key={entry.index} className={entry.passes ? 'is-pass' : 'is-fail'}>
              <span className="write-code-icon" aria-hidden="true">
                {entry.passes ? '✓' : '✕'}
              </span>
              <span className="write-code-result-text">
                <span className="write-code-sr">{entry.passes ? 'Passed:' : 'Failed:'}</span>
                <code className="write-code-call">
                  {formatCall(functionName, entry.input)}
                </code>
                <span className="write-code-compare">
                  expected <code>{formatValue(entry.expected)}</code>
                  {' · '}got{' '}
                  <code>{entry.error ? 'an error' : formatValue(entry.actual)}</code>
                </span>
              </span>
              {entry.error ? (
                <span className="write-code-test-error">{entry.error}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
