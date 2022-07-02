declare module 'applescript' {
  export function execString(code: string, cb: (err: Error | undefined, result: any) => void)
}
