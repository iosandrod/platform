import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'
import { Application } from '@feathersjs/feathers'
import { LocalStrategy } from '@feathersjs/authentication-local'
// import {} from '@feathersjs'
export class AppAuthService extends AuthenticationService {
  //用户认证体系
}



export const appAuthenticate = (app: Application) => {
  const service = new AppAuthService(app)
  let jwtStarategy = new JWTStrategy()
  let localStrategy = new LocalStrategy()
  service.register('jwt', jwtStarategy)
  service.register('local', localStrategy)
  app.use('authentication', service)
}