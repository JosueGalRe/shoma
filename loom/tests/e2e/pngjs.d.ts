declare module 'pngjs' {
  export class PNG {
    data: Buffer
    height: number
    width: number

    constructor(options: { height: number; width: number })

    static sync: {
      read(buffer: Buffer): PNG
      write(png: PNG): Buffer
    }
  }
}
