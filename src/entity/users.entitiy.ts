import { Entity, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Role } from './roles.entity'
import { Permission } from './permissions.entity'

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  username: string
  @Column({ type: 'varchar', unique: true })
  email: string
  @Column({ type: 'varchar' })
  password: string //
  @Column({ type: 'varchar' })
  companyid: string
  @Column({ type: 'varchar' })
  @ManyToOne(() => Role, (role) => role.users, { nullable: false })
  role: Role;

  @ManyToMany(() => Permission)
  @JoinTable({ name: "user_permissions" }) // 用户额外权限
  permissions: Permission[];
}
