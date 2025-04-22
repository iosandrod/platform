import { myFeathers } from './feather'
import Redis from 'ioredis'
export const redis = async (app: myFeathers) => {
  let redis = app.get('redis')
  let _redis = new Redis(redis)
  app.set('redis', _redis) //
}
