import { AuthenticationService } from '@feathersjs/authentication'
import { Application } from '@feathersjs/feathers'

export class AppAuthService extends AuthenticationService {
  //用户认证体系
}



export const appAuthenticate = (app: Application) => {
  const service = new AppAuthService(app)
}