import config from 'config' //配置文件
const mode = process.env.NODE_ENV
import { User } from './src/entity/users.entitiy'
import { Role } from './src/entity/roles.entity'
import { Permission } from './src/entity/permissions.entity'
// import { UserPermission } from './src/entity/user_permission.entity'
import { RolePermission } from './src/entity/role_permission.entity'
import { DataSource, DataSourceOptions } from 'typeorm'
import { UserRole } from './src/entity/user_role.entity'
import { Navs } from './src/entity/navs.entity'
import { ServiceEnitty } from './src/entity/services.entity'
import { ColumnEntity } from './src/entity/columns.entity'
import { Entity } from './src/entity/entity.entity'
import { Company } from './src/entity/company.entity'
import { FieldEntity } from './src/entity/fields.entity'
// import { TableEntity } from './src/entity/table.entity'
import { Upload } from './src/entity/uploads.entity'
import { DataDictionary } from './src/entity/dictionary.entity'
import { Selection } from './src/entity/selection.entity'
import knex from 'knex'
import { setCurrentDbType } from './src/entity/json/jsonColumnFactory'
import { TableView } from './src/entity/tableview.entity'
import { charArr } from './src/entity/chat.entity' //
async function main() {
  let dbConfig: DataSourceOptions = {
    type: 'postgres',
    host: 'localhost',
    username: 'postgres',
    password: '123456', //
    database: 'platform', //
   
    port: 5432, //
    synchronize: true, ////
    entities: [
      DataDictionary,
      Selection,
      FieldEntity,
      Entity,
      TableView, //
      User,
      Role,
      Permission,
      RolePermission,
      UserRole,
      Navs,
      ColumnEntity,
      Company,
      Upload,
      ...charArr
    ] //
  }
  setCurrentDbType(dbConfig.type) ////
  const dataSource = new DataSource(dbConfig)
  dataSource.initialize().then(() => {
    console.log('主数据库创建成功') //
  }) //
}
// main()

