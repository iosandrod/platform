import {
  AuthenticationBase,
  AuthenticationParams,
  AuthenticationRequest,
  AuthenticationResult,
  AuthenticationService,
  JwtVerifyOptions
} from '@feathersjs/authentication'
import { Application, HookContext, NextFunction, Params } from '@feathersjs/feathers'
import { IncomingMessage, ServerResponse } from 'http'
import { JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import { NotAuthenticated } from '@feathersjs/errors'
import { debug } from 'feathers-hooks-common'
import jsonwebtoken, { Secret } from 'jsonwebtoken'
import { get, merge, set } from 'lodash'
import bcrypt from 'bcryptjs'
import { AuthenticateHookSettings } from '@feathersjs/authentication/lib/hooks/authenticate'
import { useCaptCha } from '../decoration'
import { hooks } from '@feathersjs/hooks'
import { myJwtStrategy } from './jwt'
export class myLocalStrategy extends LocalStrategy {
  //@ts-ignore
  async authenticate(data: AuthenticationRequest, params: Params) {
    const { passwordField, usernameField, entity, errorMessage } = this.configuration
    const username = get(data, usernameField)
    const password = get(data, passwordField)
    if (!password) {
      // exit early if there is no password
      throw new NotAuthenticated(errorMessage)
    }
    const { provider, ...paramsWithoutProvider } = params
    const result = await this.findEntity(username, paramsWithoutProvider)
    await this.comparePassword(result, password)
    let _res = await this.getEntity(result, params)
    let _res1 = _res?.data || _res
    return {
      authentication: { strategy: this.name },
      [entity]: _res1 ////
    }
  }
  get configuration() {
    //@ts-ignore
    const authConfig = this.authentication.configuration
    const config = super.configuration || {}

    return {
      hashSize: 10,
      service: authConfig.service,
      entity: authConfig.entity,
      entityId: authConfig.entityId,
      errorMessage: 'Invalid login',
      entityPasswordField: config.passwordField,
      entityUsernameField: config.usernameField,
      ...config
    }
  }
  async getEntity(result: any, params: Params) {
    const entityService = this.entityService
    let config = this.configuration
    //@ts-ignore
    let entityId = entityService.getId()
    const { entity } = this.configuration
    if (!entityId || result[entityId] === undefined) {
      throw new NotAuthenticated('Could not get local entity')
    }
    if (!params.provider) {
      return result
    }
    return entityService.get(result[entityId], {
      ...params,
      [entity]: result
    }) //
  }
  async comparePassword(entity: any, password: string) {
    const { entityPasswordField, errorMessage } = this.configuration
    const hash = get(entity, entityPasswordField)

    if (!hash) {
      debug(`Record is missing the '${entityPasswordField}' password field`)
      throw new NotAuthenticated(errorMessage)
    }
    debug('Verifying password')
    const result = await bcrypt.compare(password, hash)
    if (result) {
      return entity
    }
    throw new NotAuthenticated(errorMessage)
  }
  async findEntity(username: string, params: any) {
    const { entityUsernameField, errorMessage } = this.configuration
    if (!username) {
      // don't query for users without any condition set.
      throw new NotAuthenticated(errorMessage)
    }

    const query = await this.getEntityQuery(
      {
        [entityUsernameField]: username
      },
      params
    )
    // console.log(query, 'testQuery')//
    const findParams = Object.assign({}, params, { query })
    const entityService = this.entityService
    // debug('Finding entity with query', params.query)
    const result = await entityService.find(findParams)
    const list = Array.isArray(result) ? result : result.data
    if (!Array.isArray(list) || list.length === 0) {
      // throw new Error('没找到用户') //
      throw new NotAuthenticated('用户名或者密码不对') //
    }
    const [entity] = list
    return entity
  }
}

export class myAuth extends AuthenticationService {
  constructor(app: any, key?: any, options?: any) {
    super(app, key, options) //
    this.register('jwt', new myJwtStrategy()) //
    this.register('local', new myLocalStrategy()) //
    //@ts-ignore
    let hooksMetaData = this.hooksMetaData
    if (hooksMetaData != null && Array.isArray(hooksMetaData)) {
      for (const hook of hooksMetaData) {
        hooks(this, hook)
      }
    } //
    //@ts-ignore
  }
  //@ts-ignore
  serviceName = 'authentication'
  async authenticate(
    authentication: AuthenticationRequest,
    params: AuthenticationParams,
    ...allowed: string[]
  ) {
    const strategy: any = authentication?.strategy
    const [authStrategy] = this.getStrategies(strategy)
    const strategyAllowed = allowed.includes(strategy)
    //@ts-ignore
    if (!authentication || !authStrategy || !strategyAllowed) {
      const additionalInfo =
        (!strategy && ' (no `strategy` set)') ||
        (!strategyAllowed && ' (strategy not allowed in authStrategies)') ||
        ''

      // If there are no valid strategies or `authentication` is not an object
      throw new NotAuthenticated('Invalid authentication information' + additionalInfo)
    }
    //@ts-ignore
    let _res = await authStrategy.authenticate(authentication, {
      ...params,
      authenticated: true
    })
    return _res?.data || _res //
  }
  async getTokenOptions(authResult: AuthenticationResult, params: AuthenticationParams) {
    const { service, entity, entityId } = this.configuration
    const jwtOptions = merge({}, params.jwtOptions, params.jwt)
    let value = service && entity && authResult[entity]
    value = value?.data || value //
    // Set the subject to the entity id if it is available
    if (value && !jwtOptions.subject) {
      //@ts-ignore
      const idProperty = entityId || this.app.service(service).id
      //@ts-ignore
      const subject = value[idProperty]

      if (subject === undefined) {
        throw new NotAuthenticated(`Can not set subject from ${entity}.${idProperty}`)
      }

      jwtOptions.subject = `${subject}`
    }

    return jwtOptions
  }
  //@ts-ignore
  async parse(req: IncomingMessage, res: ServerResponse, ...names: string[]) {
    console.log('正在解析') //
    const strategies = this.getStrategies(...names).filter(current => typeof current.parse === 'function')
    for (const authStrategy of strategies) {
      //@ts-ignore
      const value = await authStrategy.parse(req, res)
      // console.log(value,'dskfjlksjflsdfsd')//
      if (value !== null) {
        return value
      }
    }
    return null
  }
  async verifyAccessToken(accessToken: string, optsOverride?: JwtVerifyOptions, secretOverride?: Secret) {
    const { secret, jwtOptions } = this.configuration
    const jwtSecret = secretOverride || secret
    const options = merge({}, jwtOptions, optsOverride)
    const { algorithm } = options

    // Normalize the `algorithm` setting into the algorithms array
    if (algorithm && !options.algorithms) {
      //@ts-ignore
      options.algorithms = (Array.isArray(algorithm) ? algorithm : [algorithm]) as Algorithm[]
      delete options.algorithm
    }

    try {
      const verified = jsonwebtoken.verify(accessToken, jwtSecret, options)
      return verified as any
    } catch (error) {
      let _e: any = error
      // throw new NotAuthenticated(_e.message, error) //
      return null //
    }
  }
  @useCaptCha({}) //
  //@ts-ignore
  async create(data: any, params: any) {
    params.authenticated = true
    //@ts-ignore
    const authStrategies = params.authStrategies || this.configuration.authStrategies

    if (!authStrategies.length) {
      throw new NotAuthenticated('No authentication strategies allowed for creating a JWT (`authStrategies`)')
    }

    const authResult = await this.authenticate(data, params, ...authStrategies)
    //@ts-ignore
    if (authResult.accessToken) {
      return authResult
    }
    const [payload, jwtOptions] = await Promise.all([
      this.getPayload(authResult, params),
      this.getTokenOptions(authResult, params)
    ])
    //@ts-ignore
    const accessToken = await this.createAccessToken(payload, jwtOptions, params.secret)
    return {
      accessToken,
      ...authResult,
      authentication: {
        ...authResult.authentication,
        payload: jsonwebtoken.decode(accessToken)
      }
    }
  }
}
export const mainAuth = (app: Application) => {
  let s = new myAuth(app, 'authentication', {}) //
  // s.register('jwt', new JWTStrategy())
  // s.register('local', new myLocalStrategy())
  app.use('authentication', s)
}

export const _auth = (
  originalSettings: string | AuthenticateHookSettings,
  ...originalStrategies: string[]
) => {
  const settings =
    typeof originalSettings === 'string'
      ? { strategies: [originalSettings, ...originalStrategies] }
      : originalSettings
  return async (context: HookContext, _next?: NextFunction) => {
    const next = typeof _next === 'function' ? _next : async () => context
    const { app, params, type, path, service } = context
    const { strategies } = settings
    const { provider, authentication } = params
    const authService = app.service('authentication')
    //@ts-ignore
    if (params.authenticated === true) {
      return next()
    }
    if (authentication) {
      const { provider, authentication, ...authParams } = params
      //@ts-ignore
      const authResult = await authService.authenticate(authentication, authParams, ...strategies)
      const { accessToken, ...authResultWithoutToken } = authResult
      context.params = {
        ...params,
        ...authResultWithoutToken,
        authenticated: true
      }
    } else if (provider) {
      // throw new NotAuthenticated('Not authenticated')
    }
    return next()
  }
}

let obj = {
  provider: 'socketio',
  headers: {
    host: 'localhost:3031',
    connection: 'Upgrade',
    pragma: 'no-cache',
    'cache-control': 'no-cache',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0',
    upgrade: 'websocket',
    origin: 'http://localhost:3003',
    'sec-websocket-version': '13',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,fr;q=0.5',
    cookie:
      'session=U2FsdGVkX1/8m7tAhv2rq4Pbjsd8DSbsri1CXZ3/DrkZ6xv/YGE1bbXA5gosoyewwOyoHKvqmvgKOrhcWetEn8hw7P8nOxCE1QuIIdo6bY07MOCnERli9o5lpoOGozUB/x4XbJmg3UApx5guO+cX/g==; Hm_lvt_52eb07460b7dc3e27bb80c78c0988671=1743073927',
    'sec-websocket-key': 'nNcGSegcHH6Xz4eFSp4D0A==',
    'sec-websocket-extensions': 'permessage-deflate; client_max_window_bits',
    authorization:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE3NTAwNDc3MjQsImV4cCI6MTc1MDEzNDEyNCwiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsInN1YiI6IjEiLCJqdGkiOiJiM2Q3ODZhOC0wNTQ4LTRkZGMtYTIyYS00NTc4Y2RjZGUxN2YifQ.f0nLDh680HhW0MyK-Nrz_aEgmTG1QovFqx_1GvUgh0Q'
  },
  authentication: {
    strategy: 'jwt',
    accessToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE3NTAwNDc3MjQsImV4cCI6MTc1MDEzNDEyNCwiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsInN1YiI6IjEiLCJqdGkiOiJiM2Q3ODZhOC0wNTQ4LTRkZGMtYTIyYS00NTc4Y2RjZGUxN2YifQ.f0nLDh680HhW0MyK-Nrz_aEgmTG1QovFqx_1GvUgh0Q',
    authentication: {
      strategy: 'jwt',
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.eyJpYXQiOjE3NTAwNDc3MjQsImV4cCI6MTc1MDEzNDEyNCwiYXVkIjoiaHR0cHM6Ly95b3VyZG9tYWluLmNvbSIsInN1YiI6IjEiLCJqdGkiOiJiM2Q3ODZhOC0wNTQ4LTRkZGMtYTIyYS00NTc4Y2RjZGUxN2YifQ.f0nLDh680HhW0MyK-Nrz_aEgmTG1QovFqx_1GvUgh0Q',
      payload: [Object]
    },
    user: {
      id: 1,
      createdAt: '2025-05-24 09:13:24',
      updatedAt: '2025-05-24 09:13:24',
      username: 'dxf',
      email: '1151685410@qq.com',
      password: '$2b$10$mtmxQd1lFzh6ORBsVOsfvOzH2XN107xINOtc3AmggeDO9.CfXztXm',
      appName: null,
      companyName: 'newC',
      companyCnName: '新公司',
      companyType: null,
      companyId: null,
      phone: null,
      avatar: '/images/7332066ce14ee350ac57f9d74393a604d7c7ba4fdd3e15f3a47daa59bbc647f9.jpg',
      companyLogo: '/images/7332066ce14ee350ac57f9d74393a604d7c7ba4fdd3e15f3a47daa59bbc647f9.jpg'
    }
  }
}
