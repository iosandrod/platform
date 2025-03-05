import { BaseEntity } from "./base.entity";
import { Column, Entity } from 'typeorm'
@Entity('columns')
export class ColumnEntity extends BaseEntity {
    @Column({ type: "varchar", })
    field: string
    @Column({ type: "varchar", nullable: true })
    type: string
    @Column({ type: "varchar", nullable: true })
    comment: string
    @Column({ type: "varchar", nullable: true })
    nullable: string
    @Column({ type: "varchar", nullable: true })
    default: string
    @Column({ type: "varchar", nullable: true })
    primary: string
    @Column({ type: "varchar", nullable: true })
    unique: string
    @Column({ type: "jsonb", nullable: true })
    validate: string
    @Column({ type: "varchar", nullable: true })
    options: string
    @Column({ type: "integer", nullable: true })
    serviceId: number
}