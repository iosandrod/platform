import type { Knex } from 'knex'
import { getDefaultFields } from '../defaults'

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('users')) return
  await knex.schema.createTable('users', table => {
    getDefaultFields(table, knex)
    table.string('username').notNullable().unique()
    table.string('password').notNullable()
    table.string('email').notNullable() //
    table.integer('companyid')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}
