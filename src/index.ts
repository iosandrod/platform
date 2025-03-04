import { createApp } from './app'
import { logger } from './utils/logger'//
async function main() {
  let app = await createApp()
  const port = app.get('port')
  const host = app.get('host')
  process.on('unhandledRejection', reason => logger.error('Unhandled Rejection %O', reason))
  app.listen(port).then(async () => {
    logger.info(`Feathers app listening on http://${host}:${port}`)
  })
}

main()  