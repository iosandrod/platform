import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from 'typeorm'
import { BaseEntity } from './base.entity'
import { dateColumn } from './json/jsonColumnFactory'

// extends BaseEntity
@Entity({ name: 'DataDictionary' })
export class DataDictionary {
  @PrimaryColumn({ type: 'int', name: 'iInterID' })
  iInterID: number

  @Column({ type: 'varchar', name: 'DictionaryName' })
  DictionaryName: string

  @Column({ type: 'varchar', name: 'DictionaryKey' })
  DictionaryKey: string

  @Column({ type: 'varchar', name: 'DictionaryValue' })
  DictionaryValue: string

  @Column({ type: 'varchar', name: 'Remark', nullable: true })
  Remark?: string

  @Column({ type: 'varchar', name: 'cModule', nullable: true })
  cModule?: string

  @Column({ type: 'varchar', name: 'cType', nullable: true })
  cType?: string

  @Column({ ...dateColumn({ name: "dOpeDate" , nullable: true}), })//
  dOpeDate?: Date

  @Column({ type: 'varchar', name: 'cDetailNote', nullable: true })
  cDetailNote?: string

  @Column({ type: 'varchar', name: 'cDefine1', nullable: true })
  cDefine1?: string

  @Column({ type: 'varchar', name: 'cDefine2', nullable: true })
  cDefine2?: string

  @Column({ type: 'varchar', name: 'cDefine3', nullable: true })
  cDefine3?: string

  @Column({ type: 'varchar', name: 'cDefine4', nullable: true })
  cDefine4?: string

  @Column({ type: 'varchar', name: 'cDefine5', nullable: true })
  cDefine5?: string

  @Column({ type: 'varchar', name: 'cDefine6', nullable: true })
  cDefine6?: string

  @Column({ type: 'varchar', name: 'cDefine7', nullable: true })
  cDefine7?: string

  @Column({ type: 'varchar', name: 'cDefine8', nullable: true })
  cDefine8?: string

  @Column({ type: 'varchar', name: 'cDefine9', nullable: true })
  cDefine9?: string

  @Column({ type: 'varchar', name: 'cDefine10', nullable: true })
  cDefine10?: string

  @Column({ type: 'numeric', name: 'cDefine11', nullable: true })
  cDefine11?: number

  @Column({ type: 'numeric', name: 'cDefine12', nullable: true })
  cDefine12?: number

  @Column({ type: 'numeric', name: 'cDefine13', nullable: true })
  cDefine13?: number

  @Column({ type: 'numeric', name: 'cDefine14', nullable: true })
  cDefine14?: number

  @Column({ type: 'timestamp', name: 'cDefine15', nullable: true })
  cDefine15?: Date

  @Column({ type: 'timestamp', name: 'cDefine16', nullable: true })
  cDefine16?: Date

  @Column({ type: 'char', length: 1, name: 'bVisible', nullable: true, default: () => `'1'` })
  bVisible?: string
}  