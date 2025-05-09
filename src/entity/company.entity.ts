import { Column, Entity } from 'typeorm'
import { BaseEntity } from './base.entity'
import { useHook } from '../decoration'
@Entity('company') //
export class Company extends BaseEntity {
  @Column({ nullable: true })
  name: string //
  @Column({ nullable: true })
  connection: string //
  @Column({ nullable: true })
  type: string //
  @Column({ nullable: true })
  companyid: string //
  @Column({ nullable: true })
  appName: string ////
  @Column({ type: 'varchar', nullable: true })
  //公司描述
  description: string //
}
export default Company //
