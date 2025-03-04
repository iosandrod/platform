import config from 'config'//配置文件
const mode = process.env.NODE_ENV
import { User } from './src/entity/users.entitiy'
import { Role } from './src/entity/roles.entity'
import { Permission } from './src/entity/permissions.entity'
import { UserPermission } from './src/entity/user_permission.entity'
import { RolePermission } from './src/entity/role_permission.entity'
import { DataSource, DataSourceOptions } from 'typeorm'
function main() {
    if (mode === 'development') {
        let dbConfig: DataSourceOptions = {
            type: "postgres",
            host: "localhost",
            port: 5432,
            username: "postgres",
            password: "123456",
            database: "erp",
            synchronize: true,
            entities: [User, Role, Permission, UserPermission, RolePermission],
        }
        const dataSource = new DataSource(dbConfig)
        dataSource.initialize().then(() => {
            console.log('数据库连接成功')
        })
    }
}
main()