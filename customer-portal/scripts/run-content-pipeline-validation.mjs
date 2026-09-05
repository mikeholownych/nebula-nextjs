#!/usr/bin/env node

import { accessSync, constants } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const portalRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
const repositoryRoot = resolve(portalRoot, "..")
const python = resolve(repositoryRoot, ".venv", "bin", "python")
const testFiles = [
  resolve(repositoryRoot, "tests", "test_content_pipeline_validation.py"),
  resolve(repositoryRoot, "tests", "test_content_pipeline_workflow.py"),
]

try {
  accessSync(python, constants.X_OK)
} catch {
  console.error(
    `Content pipeline validation requires ${python}. ` +
      "Create the repository environment with `uv sync --dev`, then rerun npm run ci.",
  )
  process.exit(1)
}

const result = spawnSync(python, ["-m", "pytest", ...testFiles, "-q"], {
  cwd: repositoryRoot,
  stdio: "inherit",
})

if (result.error) {
  console.error(`Unable to execute content pipeline validation: ${result.error.message}`)
  process.exit(1)
}

if (result.signal) {
  console.error(`Content pipeline validation terminated by ${result.signal}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
