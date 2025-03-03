import type { Knex } from 'knex'
import { getDefaultFields } from '../defaults'

export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('app')) return
  await knex.schema.createTable('app', table => {
    getDefaultFields(table, knex) //
    table.string('description').notNullable()
    table.integer('companyid').notNullable()
  }) //
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.dropTable('app')
}
