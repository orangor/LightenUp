// 定义全局 fabric 命名空间，包含类型
declare namespace fabric {
  interface IEvent {
    target?: Object
  }

  class Object {
    left?: number
    top?: number
    width?: number
    height?: number
    scaleX?: number
    scaleY?: number
    opacity?: number
    visible?: boolean
    selectable?: boolean
    evented?: boolean
    hasControls?: boolean
    lockMovementX?: boolean
    lockMovementY?: boolean
    lockRotation?: boolean
    lockScalingX?: boolean
    lockScalingY?: boolean
    hoverCursor?: string
    name?: string
    data?: any

    set(props: any): Object
    set(key: string, value: any): Object
    getCenterPoint(): { x: number; y: number }
    setCoords(): void
    clone(callback: (cloned: Object) => void, propertiesToInclude?: string[]): void
    toObject(propertiesToInclude?: string[]): any
    setControlVisible(controlName: string, visible: boolean): void
    on(eventName: string, handler: (e: IEvent) => void): void
    off(eventName: string, handler: (e: IEvent) => void): void
  }

  class Image extends Object {
    constructor(element?: string | HTMLImageElement, options?: any)
    width?: number
    height?: number
    scale(s: number): Image
    static fromURL(url: string, callback: (img: Image) => void, options?: any): void
  }

  class IText extends Object {
    constructor(text: string, options?: any)
    text: string
    fontSize?: number
    fontWeight?: string | number
    fill?: string
    textAlign?: string
    fontFamily?: string
    backgroundColor?: string
  }

  class Textbox extends IText {
    constructor(text: string, options?: any)
  }

  class Line extends Object {
    constructor(points: number[], options?: any)
  }

  class Rect extends Object {
    constructor(options?: any)
    width?: number
    height?: number
  }

  interface Point {
    x: number
    y: number
  }

  class Circle extends Object {
    constructor(options?: any)
    radius?: number
  }

  class Triangle extends Object {
    constructor(options?: any)
    width?: number
    height?: number
  }

  class Polygon extends Object {
    constructor(points: Point[], options?: any)
    points?: Point[]
  }

  class Gradient {
    constructor(options?: any)
  }

  class Canvas {
    constructor(el: string | HTMLCanvasElement, options?: any)
    width?: number
    height?: number
    isDrawingMode: boolean
    backgroundColor?: string | object

    setWidth(w: number): void
    setHeight(h: number): void
    getWidth(): number
    getHeight(): number

    add(...obj: any[]): void
    remove(...obj: any[]): void
    getObjects(type?: string): Object[]
    getActiveObject(): Object | null
    setActiveObject(obj: Object): Canvas
    discardActiveObject(): Canvas

    renderAll(): void
    requestRenderAll(): void

    sendToBack(obj: any): void
    bringToFront(obj: any): void
    bringForward(obj: any): void
    sendBackwards(obj: any): void

    on(eventName: string, handler: (e: IEvent) => void): void
    off(eventName: string, handler: (e: IEvent) => void): void
    dispose(): void
    toDataURL(options?: any): string
    clear(): void
    setBackgroundColor(backgroundColor: string | object, callback: Function): void
  }

  export const util: {
    enlivenObjects(objects: any[], callback: (objects: Object[]) => void, namespace: string): void
  }
}

// 声明模块导出，使得 import { fabric } from 'fabric' 可用
// 且 fabric 既是值（包含 Canvas 等类）也是命名空间（包含类型）
declare module 'fabric' {
  export { fabric }
}
