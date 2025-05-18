import { BaseEntity } from './base.entity'
import { Column, Entity } from 'typeorm'
@Entity('columns')
export class ColumnEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  field: string
  @Column({ type: 'varchar', nullable: true })
  type: string
  @Column({ type: 'varchar', nullable: true })
  tableName: string
  @Column({ type: 'varchar', nullable: true }) //
  comment: string
  @Column({ type: 'integer', nullable: true })
  nullable: number //
  @Column({ type: 'varchar', nullable: true })
  default: string //
  @Column({ type: 'varchar', nullable: true })
  primary: string
  @Column({ type: 'varchar', nullable: true })
  unique: string
  @Column({ type: 'jsonb', nullable: true })
  validate: string
  @Column({ type: 'integer', nullable: true })
  serviceId: number
  @Column({ type: 'varchar', nullable: true })
  title: number
  @Column({ type: 'integer', nullable: true })
  width: number
  @Column({ type: 'varchar', nullable: true })
  align: string
  @Column({ type: 'varchar', nullable: true })
  frozen: string //
  @Column({ type: 'varchar', nullable: true })
  formatFn: string
  @Column({ type: 'integer', nullable: true })
  hidden: number
  @Column({ type: 'varchar', nullable: true })
  editType: string //
  @Column({ type: 'varchar', nullable: true })//
  editOptions: string
  @Column({ type: 'varchar', nullable: true })
  defaultValue: string //
  @Column({ type: 'varchar', nullable: true })
  defaultValueType: string //
  @Column({ type: 'jsonb', nullable: true }) //
  options: number
  @Column({ type: 'varchar', nullable: true })
  optionsField: string //
  @Column({ type: 'varchar', nullable: true })
  fieldFormat: string //
}
