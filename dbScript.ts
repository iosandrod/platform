import config from 'config'//配置文件
const mode = process.env.NODE_ENV
import { User } from './src/entity/users.entitiy'
import { Role } from './src/entity/roles.entity'
import { Permission } from './src/entity/permissions.entity'
import { UserPermission } from './src/entity/user_permission.entity'
import { RolePermission } from './src/entity/role_permission.entity'
function main() {
    if (mode === 'development') {

    }
}
main()