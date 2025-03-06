import { AuthenticationBase, AuthenticationParams, AuthenticationRequest, AuthenticationResult, AuthenticationService } from '@feathersjs/authentication'
import { Application } from '@feathersjs/feathers'
import { IncomingMessage, ServerResponse } from 'http'
import { JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import { NotAuthenticated } from '@feathersjs/errors'
import { debug } from 'feathers-hooks-common'
import jsonwebtoken from 'jsonwebtoken'
import { get, set } from 'lodash'
import bcrypt from 'bcryptjs'

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

    return {
      authentication: { strategy: this.name },
      [entity]: await this.getEntity(result, params)
    }
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

}

export class myAuth extends AuthenticationService {
  //@ts-ignore

  async authenticate(
    authentication: AuthenticationRequest,
    params: AuthenticationParams,
    ...allowed: string[]
  ) {
    // let { strategy  } = authentication || {}
    const strategy: any = authentication?.strategy
    const [authStrategy] = this.getStrategies(strategy)
    const strategyAllowed = allowed.includes(strategy)
    //@ts-ignore
    debug('Running authenticate for strategy', strategy, allowed)

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
    return _res
  }
  //@ts-ignore
  async create(data: any, params: any) {
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
    debug('Creating JWT with', payload, jwtOptions)

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
