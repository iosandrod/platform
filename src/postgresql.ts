// For more information about this file see https://dove.feathersjs.com/guides/cli/databases.html
import knex from 'knex'
import type { Knex } from 'knex'
import type { Application } from './declarations'
import pg from 'pg'
import moment from 'moment-timezone'
pg.types.setTypeParser(1184, (val: any) => moment.tz(val, 'Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'))
//
// 可选：也处理 timestamp without time zone
pg.types.setTypeParser(1114, (val: any) => moment.tz(val, 'Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'))
declare module './declarations' {
  interface Configuration {
    postgresqlClient: Knex
  }
}

export const postgresql = async (app: Application) => {
  let config: any = app.get('postgresql') //
  let pool = config?.pool
  if (pool == null) {
    pool = {
      min: 2,
      max: 50 //
    }
    config.pool = pool
  }
  // pool.afterCreate = (conn: any, done: any) => {
  //   conn.query(`SET TIME ZONE 'Asia/Shanghai';`, (err: any) => {
  //     done(err, conn)
  //   })
  // }
  config = {
    ...config
  }
  let db = knex(config!)
  setTimeout(() => {
    db.raw('SELECT 1') //
  }, 2000)
  await db.raw('SET TIME ZONE "Asia/Shanghai"')
  // console.log('run here')//
  app.set('postgresqlClient', db)
}
//
