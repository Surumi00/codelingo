// Runs learner Python inside a worker so a bad loop cannot freeze the page.
//
// The component imports this file as raw text and starts it from a Blob URL as
// a classic worker, which keeps `importScripts` available for loading Pyodide
// from the CDN. Nothing here may use ES module syntax.

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js'

// Defined once per worker. Each test runs the learner's code in a fresh
// namespace and reports a JSON-converted value (or a readable error).
const HARNESS = [
  'import json',
  '',
  '',
  'def _codelingo_run(code, name, args_json):',
  '    outcome = {"ok": False, "value": None, "error": None}',
  '    namespace = {"__name__": "__learner__"}',
  '    try:',
  '        exec(compile(code, "<your code>", "exec"), namespace)',
  '    except BaseException as exc:',
  '        outcome["error"] = type(exc).__name__ + ": " + str(exc)',
  '        return outcome',
  '    fn = namespace.get(name)',
  '    if not callable(fn):',
  '        outcome["error"] = "Your code does not define a function named " + name + "()."',
  '        return outcome',
  '    try:',
  '        args = json.loads(args_json)',
  '        value = fn(*args)',
  '    except BaseException as exc:',
  '        outcome["error"] = type(exc).__name__ + ": " + str(exc)',
  '        return outcome',
  '    try:',
  '        outcome["value"] = json.loads(json.dumps(value))',
  '    except BaseException:',
  '        outcome["error"] = "The function returned a value that cannot be compared."',
  '        return outcome',
  '    outcome["ok"] = True',
  '    return outcome',
  '',
].join('\n')

let runtimePromise = null
let runtime = null

function loadRuntime() {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      importScripts(PYODIDE_URL)
      const loaded = await self.loadPyodide()
      loaded.runPython(HARNESS)
      runtime = loaded
      return loaded
    })()
  }

  return runtimePromise
}

function runTest(pyodide, code, functionName, test) {
  const input = Array.isArray(test.input) ? test.input : []

  pyodide.globals.set('_codelingo_code', code)
  pyodide.globals.set('_codelingo_name', functionName)
  pyodide.globals.set('_codelingo_args', JSON.stringify(input))

  const raw = pyodide.runPython(
    'json.dumps(_codelingo_run(_codelingo_code, _codelingo_name, _codelingo_args))',
  )

  return JSON.parse(raw)
}

self.onmessage = async (event) => {
  const message = event.data || {}

  if (message.type === 'init') {
    try {
      await loadRuntime()
      self.postMessage({ type: 'ready' })
    } catch (error) {
      self.postMessage({ type: 'load-error', message: String(error) })
    }

    return
  }

  if (message.type !== 'run') {
    return
  }

  const { id, code, functionName, tests } = message

  try {
    const pyodide = runtime || (await loadRuntime())
    const results = []

    for (let index = 0; index < tests.length; index += 1) {
      const outcome = runTest(pyodide, code, functionName, tests[index])

      results.push({
        index,
        ok: outcome.ok === true,
        value: outcome.value,
        error: outcome.error || null,
      })
    }

    self.postMessage({ type: 'result', id, results })
  } catch (error) {
    self.postMessage({
      type: 'run-error',
      id,
      message: String((error && error.message) || error),
    })
  }
}
