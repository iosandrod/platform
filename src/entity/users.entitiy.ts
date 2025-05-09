import { Entity, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Role } from './roles.entity'
import { Permission } from './permissions.entity'

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  username: string
  @Column({ type: 'varchar', unique: true })
  email: string
  @Column({ type: 'varchar', nullable: true })
  password: string //
  @Column({ type: 'varchar', nullable: true }) //
  companyid: string
  @Column({ type: 'varchar', nullable: true }) //
  appName: string
  @ManyToMany(() => Role, { nullable: true })
  @JoinTable({ name: 'user_roles' }) // 用户角色表
  roles: Role[]
  @Column({ type: 'varchar', nullable: true })
  companyName: string
  @Column({ type: 'varchar', nullable: true })
  //公司中文名
  companyCnName: string //
  @Column({ type: 'varchar', nullable: true })
  //公司类型
  companyType: string //
  @Column({ type: 'integer', nullable: true }) //
  companyId: number
} //
