import { SwaggerRouteConfig, BasePathConfig, Security, Parameter } from '../types'
import { authConfig } from '../config/auth.config'
import { csrfConfig } from '../config/csrf.config'

export class DocGenerator {
  private static paths: Record<string, any> = {}

  // // 1. 创建基础配置
  // private static createBaseConfig(info: SwaggerRouteConfig): BasePathConfig {
  //   return {
  //     path: info.path,
  //     method: info.method,
  //     summary: info.summary,
  //     description: info.description,
  //     tags: info.tags,
  //     parameters: info.parameters,
  //     security: info.security,
  //     responses: info.responses,
  //   }
  // }

  // 4. 添加AUTH认证配置
  private static addAuthConfig(config: BasePathConfig, path: string): void {
    if (authConfig.shouldCheckAuth(path)) {
      config.security = [
        {
          bearerAuth: [], // 只处理 Bearer token
        },
      ]
      config.parameters.push(authConfig.swagger.parameter)
    }
  }
  // 跳过CSRF认证
  private static addCsrfConfig(config: BasePathConfig, path: string): void {
    if (!csrfConfig.shouldIgnore(path)) {
      config.parameters.push(csrfConfig.swagger.parameter)
    }
  }
  // 5. 主方法
  public static addRoute(info: SwaggerRouteConfig): void {
    const { path, method } = info
    if (!this.paths[path]) {
      this.paths[path] = {}
    }

    const pathConfig = info //this.createBaseConfig(info)

    this.addAuthConfig(pathConfig, path)
    this.addCsrfConfig(pathConfig, path)

    if (info.requestBody) {
      pathConfig.requestBody = info.requestBody
    }

    this.paths[path][method.toLowerCase()] = pathConfig
  }

  // 6. 获取所有路径配置
  public static getPaths() {
    return this.paths
  }
}
