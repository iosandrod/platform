import { BaseEntity } from './base.entity'
import { Column, Entity } from 'typeorm'
@Entity('fields') //
export class FieldEntity extends BaseEntity {
  //table form any
  @Column({ type: 'varchar' })
  type: string
  @Column({ type: 'varchar', nullable: true })
  style: string
  @Column({ type: 'varchar', nullable: true })
  //is json object
  options: string
  @Column({ type: 'varchar', nullable: true })
  primary: string
  @Column({ type: 'varchar', nullable: true })
  key: string
  @Column({ type: 'varchar', nullable: true })
  uuid: string //
  @Column({ type: 'varchar', nullable: true })
  parentId: string
  @Column({ type: 'varchar', nullable: true })
  layout: string //用于存放子表单类型数据
}
