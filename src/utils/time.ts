export function getNowMs() {
  return new Date(Date.now()).getTime()
}

export async function runWithChrono<T>(
  task: () => Promise<T>
): Promise<{ res: T; duration: number }> {
  const startMs = getNowMs()
  const res = await task()
  const duration = getNowMs() - startMs
  return { res, duration }
}
