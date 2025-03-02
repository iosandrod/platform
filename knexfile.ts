// For more information about this file see https://dove.feathersjs.com/guides/cli/databases.html
import { createApp } from './src/app'
// import config from 'config'
// let pgConfig = config.get('postgresql')
const app = createApp()
const pgConfig = app.get('postgresql')
module.exports = pgConfig//