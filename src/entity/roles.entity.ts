import { Entity, Column } from 'typeorm'
import { BaseEntity } from './base.entity'

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
}
