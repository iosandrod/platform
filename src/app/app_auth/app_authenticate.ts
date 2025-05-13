import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'
import { Application } from '@feathersjs/feathers'
import { LocalStrategy } from '@feathersjs/authentication-local'
import { myAuth } from '../../auth'
// import {} from '@feathersjs'
export class AppAuthService extends AuthenticationService {
  //用户认证体系
}

export const appAuthenticate = (app: Application) => {
  
  let s = new myAuth(app, 'authentication', {}) ////
  // s.register('jwt', new JWTStrategy())
  // s.register('local', new myLocalStrategy())
  app.use('authentication', s)
}
