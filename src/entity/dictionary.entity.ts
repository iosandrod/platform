import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { BaseEntity } from './base.entity'

@Entity('dictionary')
export class Dictionary extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string //
  @Column({ type: 'varchar', nullable: true })
  value: string
} //
