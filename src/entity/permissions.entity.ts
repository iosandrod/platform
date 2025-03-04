import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("permissions")
export class Permission extends BaseEntity {

    @Column({ type: "varchar" })
    action: string; // read, create, update, delete, manage

    @Column({ type: "varchar" })
    subject: string; // Article, Comment, User, all
}
