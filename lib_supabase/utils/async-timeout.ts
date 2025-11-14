// ABOUTME: Provides reusable timeout utilities for asynchronous workflows.
// ABOUTME: Prevents long-running operations from hanging critical paths.

export class TimeoutError extends Error {
  operation: string
  timeoutMs: number

  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`)
    this.name = 'TimeoutError'
    this.operation = operation
    this.timeoutMs = timeoutMs
  }
}

export async function withTimeout<T>(
  operation: () => Promise<T> | T,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  let timer: NodeJS.Timeout | undefined

  try {
    return await new Promise<T>((resolve, reject) => {
      timer = setTimeout(() => {
        reject(new TimeoutError(operationName, timeoutMs))
      }, timeoutMs)

      if (typeof (timer as any).unref === 'function') {
        ;(timer as any).unref()
      }

      Promise.resolve()
        .then(operation)
        .then(result => {
          if (timer) {
            clearTimeout(timer)
          }
          resolve(result)
        })
        .catch(error => {
          if (timer) {
            clearTimeout(timer)
          }
          reject(error)
        })
    })
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}
