import { AuthenticationBase, AuthenticationRequest, AuthenticationService } from '@feathersjs/authentication'
import { Application } from '@feathersjs/feathers'
import { IncomingMessage, ServerResponse } from 'http'
import { JWTStrategy } from '@feathersjs/authentication'
export class myAuth extends AuthenticationService {
  //   constructor(app: Application, configKey: string, options: any) {
  //     super(app, configKey, options)
  //   }
  async parse(req: IncomingMessage, res: ServerResponse, ...names: string[]): Promise<AuthenticationRequest> {
    let result = await super.parse(req, res, ...names)
    return result //
  }
}
export const auth = (app: Application) => {
  let s = new myAuth(app, 'authentication', {}) //
  s.register('jwt', new JWTStrategy())
  app.use('authentication', s, {
    koa: {
      before: [
        async (context, next) => {
          await next() //
        }
      ] //
    } //
  }) //
}
