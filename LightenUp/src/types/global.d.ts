interface Window {
  WeixinJSBridge: {
    call: (method: string, params?: any) => void
  }
}

declare const WeixinJSBridge: Window['WeixinJSBridge']
