import type { Knex } from "knex";
import { getDefaultFields } from "../defaults";

export async function up(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable('company')) return
    await knex.schema.createTable('company', table => {
        getDefaultFields(table, knex)
        table.string('name').notNullable()
        //公司id
        table.string('companyid').notNullable().unique()
        table.string('address').notNullable()//地址
        table.string('phone').notNullable()//电话
        table.string('email').notNullable()//邮箱
        table.string('logo').nullable()
        table.string('description').notNullable()
    })
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.dropTable('company')//删除
}

export function seed(knex: Knex): Promise<void> {
    //种子数据//
    return Promise.resolve()
}