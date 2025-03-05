import config from 'config'//配置文件
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
function main() {
    if (mode === 'development') {
        let dbConfig: DataSourceOptions = {
            type: "postgres",
            host: "localhost",
            port: 5432,
            username: "postgres",
            password: "123456",
            database: "erp",// 
            synchronize: true,
            entities: [User, Role, Permission, RolePermission, UserRole],//
        }
        const dataSource = new DataSource(dbConfig)
        dataSource.initialize().then(() => {
            console.log('数据库创建成功')//
        })
    }
    if (mode == 'main') {
        let dbConfig: DataSourceOptions = {
            type: "postgres",
            host: "localhost",
            port: 5432,
            username: "postgres",
            password: "123456",
            database: "platform",
            synchronize: true,
            entities: [User, Role, Permission, RolePermission, UserRole, Navs, ColumnEntity],
        }
        const dataSource = new DataSource(dbConfig)
        dataSource.initialize().then(() => {
            console.log('主数据库创建成功')//
        })
    }
}
main()