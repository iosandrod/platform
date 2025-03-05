import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Role } from "./roles.entity";
import { Permission } from "./permissions.entity";
import { BaseEntity } from "./base.entity";
import { User } from "./users.entitiy";

@Entity("user_roles")
export class UserRole extends BaseEntity {

}
