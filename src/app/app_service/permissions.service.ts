import { useRoute } from '../../decoration'
import { BaseService } from './base.service'

export class PermissinoService extends BaseService {
  constructor(options: any) {
    super(options)
  }
  @useRoute()
  async getAllPermissions() {
    let app = this.app
    let navs = app.service('navs') //
  }
}
export default PermissinoService
