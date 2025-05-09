import { LocalStrategy } from '@feathersjs/authentication-local'
import { useAuthenticate, useHook, useMethodTransform, useRoute, useUnAuthenticate } from '../decoration'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest, errors } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
import { myFeathers } from '../feather'
import { BaseService } from './base.service'
import createSvg from 'svg-captcha'
export class CaptchaService extends BaseService {
  serviceName?: string | undefined = 'captcha' //
  constructor(options: any) {
    super(options) //
  }
  //@ts-ignore
  @useUnAuthenticate()
  async create(data: any, params: any) {
    let headers = params.headers //
    let host = headers.host
    let app = this.app
    let captchaData = app.captchaData //
    let target = captchaData[host]
    if (target == null) {
      captchaData[host] = {} //
      target = captchaData[host] //
    }
    let api = null
    if (typeof data == 'string') {
      api = data
    } else {
      api = data.api
    }
    if (api == null) {
      throw new errors.BadRequest('验证码获取失败') //
    }
    let _d = createSvg.create({})
    let text = _d.text
    target[api] = { text: text, date: Date.now() }
    //@ts-ignore
    return _d //
  } //
  //@ts-ignore
  async find(data) {}
}
export default CaptchaService
