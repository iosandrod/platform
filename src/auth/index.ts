import {
  AuthenticationBase,
  AuthenticationParams,
  AuthenticationRequest,
  AuthenticationResult,
  AuthenticationService
} from '@feathersjs/authentication'
import { Application, HookContext, NextFunction, Params } from '@feathersjs/feathers'
import { IncomingMessage, ServerResponse } from 'http'
import { JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import { NotAuthenticated } from '@feathersjs/errors'
import { debug } from 'feathers-hooks-common'
import jsonwebtoken from 'jsonwebtoken'
import { get, merge, set } from 'lodash'
import bcrypt from 'bcryptjs'
import { AuthenticateHookSettings } from '@feathersjs/authentication/lib/hooks/authenticate'
import { useCaptCha } from '../decoration'

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
export class myJwtStrategy extends JWTStrategy {
  //@ts-ignore
  async parse(...args) {
    //@ts-ignore
    return super.parse(...args)
  }
}
export class myAuth extends AuthenticationService {
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
    const strategies = this.getStrategies(...names).filter(current => typeof current.parse === 'function')
    for (const authStrategy of strategies) {
      //@ts-ignore
      const value = await authStrategy.parse(req, res)
      if (value !== null) {
        return value
      }
    }
    return null
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
  s.register('jwt', new JWTStrategy())
  s.register('local', new myLocalStrategy())
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
