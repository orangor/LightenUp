# Token 与验证链接有效期说明

## 调整后的配置

| 类型 | 当前有效期 | 配置位置 | 说明 |
| --- | --- | --- | --- |
| 登录 token | 7 天 | `LightenUpServe/.env`、`src/.env` 中的 `JWT_EXPIRES_IN` | 用于用户登录后的身份保持 |
| CSRF token | 7 天 | `src/config/csrf.config.ts` 中的 `token.redis.expiry` | 用于服务端保存 CSRF token 的 Redis TTL |
| 邮箱验证链接 | 7 天 | `src/models/user.model.ts` 中的 `createVerificationToken` | 给新注册用户更充足的收件和处理时间 |
| 重置密码链接 | 24 小时 | `src/models/user.model.ts` 中的 `createPasswordResetToken` | 兼顾找回便利性与安全性 |

## 调整理由

- 登录 token 改为 7 天，减少频繁重新登录带来的中断，更适合常规 Web 应用的连续使用场景。
- CSRF token 改为 7 天，与登录 token 的使用周期保持一致，减少前端重复获取 token 的频率。
- 邮箱验证链接改为 7 天，降低用户因未及时查收邮件导致注册链接失效的概率。
- 重置密码链接保留较短有效期，改为 24 小时而不是 7 天，避免敏感链接暴露时间过长。

## 维护建议

- 如果后续要继续统一管理，建议把邮箱验证和重置密码的有效期也迁移到环境变量中。
- 当前 CSRF 中间件仍配置了 `ignorePaths: ['/api']`，这会让大部分 `/api` 请求跳过校验；如果后续要正式启用 CSRF，需要同步调整忽略路径策略。
