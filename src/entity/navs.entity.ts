import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";
@Entity("navs")
export class Navs extends BaseEntity {
    @Column({ type: "varchar", nullable: true })
    navname: string
    @Column({ type: "varchar", nullable: true })
    url: string
    @Column({ type: "varchar", nullable: true })
    icon: string
    @Column({ type: "integer", nullable: true })
    pid: string
    @Column({ type: "integer", nullable: true })
    sort: number
    @Column({ type: "varchar", nullable: true })
    remark: string
    @Column({ type: "varchar", nullable: true })
    status: string
    @Column({ type: "varchar", nullable: true })
    type: string
    @Column({ type: "varchar", nullable: true })
    appId: string
    @Column({ type: "varchar", nullable: true })
    appCode: string
}