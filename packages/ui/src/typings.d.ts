declare module '*.module.css' {
  const classes: {[key: string]: string}
  export default classes
}

declare module '*.module.less' {
  const classes: {[key: string]: string}
  export default classes
}

declare module 'applescript' {
  export function execString(code: string, cb: (err?: Error, result: any) => void)
}
