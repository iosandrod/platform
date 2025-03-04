import { KnexService } from '@feathersjs/knex'
import { BaseEntity } from '../../entity/base.entity';
import { BaseService as MainBaseService } from '../../services/base.service';
export class BaseService extends MainBaseService {
  //使用通用增删改查
  constructor(options: any) {
    super(options)//
  }
}
