import { createApp } from './app'
import { channels } from './channels/channels'
import { myFeathers } from './feather'
import { logger } from './utils/logger' //
import { Application } from '@feathersjs/koa'
async function main() {
  //@ts-ignore
  let app: Application & myFeathers = await createApp()
  const port = app.get('port')
  const host = app.get('host')
  process.on('unhandledRejection', reason => logger.error('Unhandled Rejection %O', reason))
  //@ts-ignore
  app.listen(port).then(async () => {
    const server = app.server
    const subApp = app.subApp //
    for (const [key, sApp] of Object.entries(subApp)) {
      await sApp.setup(server) //
      //@ts-ignore
      sApp.configure(channels)
    }
    logger.info(`Feathers app listening on http://${host}:${port}`)
  })
} //
main()
