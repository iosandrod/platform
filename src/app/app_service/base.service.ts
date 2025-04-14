import { KnexService } from '@feathersjs/knex'
import { BaseEntity } from '../../entity/base.entity';
import { BaseService as MainBaseService } from '../../services/base.service';
export class BaseService extends MainBaseService {
  appName = 'erp'//
  //使用通用增删改查
  constructor(options: any) {
    super(options)//
  }
  async init(mainApp?: any) { //
    //子应用的子应用
    let name = mainApp.get('appName')
    if (name == null || name !== this.appName) {
      return
    }
    await super.init(mainApp)//
  }
}
export default BaseService