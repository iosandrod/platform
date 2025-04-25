import { BaseEntity } from "./base.entity";
import { Column, Entity } from 'typeorm'
@Entity('tables')
export class TableEntity extends BaseEntity {
    @Column({ type: "varchar" })
    tableName: string
    @Column({ type: "jsonb", nullable: true })
    tableConfig: string//
}