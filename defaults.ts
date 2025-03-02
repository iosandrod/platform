import { Knex } from 'knex'
import * as knex from 'knex'
import { } from 'knex'
export const getDefaultFields = (table: Knex.CreateTableBuilder, knex: Knex) => {
    table.increments('id').primary()
    table.datetime('createdAt').defaultTo(knex.fn.now())
    //@ts-ignore
    table.datetime('updatedAt').defaultTo(knex.fn.now())//
    // table.datetime('updatedAt').defaultTo()//
}