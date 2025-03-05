import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";
@Entity('services')
export class ServiceEnitty extends BaseEntity {
    @Column({ type: "varchar", nullable: true })
    serviceName: string
    @Column({ type: "varchar", nullable: true })
    hooks: string
    @Column({ type: "integer", nullable: true })
    appId: number
    @Column({ type: "integer", nullable: true })
    pid: string//
    @Column({ type: "integer", nullable: true })
    relateId: number
    @Column({ type: "varchar", nullable: true })
    cnName: string//
}