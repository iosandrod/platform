import { KnexService } from '@feathersjs/knex'
import { Knex } from 'knex'
import { Application } from '../declarations'
/* 
    type: 'character varying',
    maxLength: 255,
    nullable: false,
    defaultValue: null
*/
export type columnInfo = Partial<Knex.ColumnInfo>
export class BaseService extends KnexService {
    columns: string[] = []
    columnInfo: columnInfo[] = []
    async setup(mainApp?: Application) {//
        const Model = this.Model
        let table = Model(this.schema)//
        let columns = await table.columnInfo()
        const allColumnName = Object.keys(columns)
        this.columns = allColumnName
    }//模型校验
    async validate() {

    }
}
