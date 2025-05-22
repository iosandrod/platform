import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { BaseEntity } from './base.entity'

@Entity('selection')
export class Selection extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  datasql: string // read, create, update, delete, manage
  @Column({ type: 'jsonb', nullable: true })
  options: string // Article, Comment, User, all
}
