declare module 'applescript' {
  export function execString(code: string, cb: (err: Error | undefined, result: any) => void): void
}

declare module 'launch-editor' {
  export default function launch(
    file: string,
    editor?: string,
    cb?: (fileName: string, errorMsg: string) => void,
  ): void
}
