import { Attachment, Friend, GroupUser, Message } from './chat.entity'
import { ColumnEntity } from './columns.entity'
import Company from './company.entity'
import { DataDictionary } from './dictionary.entity'
import { Entity } from './entity.entity'
import { Navs } from './navs.entity'
import { Permission } from './permissions.entity'
import { RolePermission } from './role_permission.entity'
import { Role } from './roles.entity'
import { TableView } from './tableview.entity'
import { Upload } from './uploads.entity'
import { UserRole } from './user_role.entity'
import { User } from './users.entitiy'

export default [
  User,
  ColumnEntity,
  Company,
  RolePermission,
  Permission,
  Role,
  TableView,
  UserRole,
  DataDictionary,
  Upload,
  Navs,
  Entity,
  Friend,
  GroupUser,
  Attachment,
  Message
]

export const defaultEntity = [
  User,
  ColumnEntity,
  Company,
  RolePermission,
  Permission,
  Role,
  TableView,
  UserRole,
  DataDictionary,
  Upload,
  Navs,
  Entity,
  Friend,
  GroupUser,
  Attachment,
  Message
] //
