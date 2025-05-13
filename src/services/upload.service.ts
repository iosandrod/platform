import { LocalStrategy } from '@feathersjs/authentication-local'
import {
  useAuthenticate,
  useCaptCha,
  useHook,
  useMethodTransform,
  useRoute,
  useUnAuthenticate
} from '../decoration'
import { BaseService } from './base.service'
import { HookContext, hooks } from '@feathersjs/hooks'
import { BadRequest, errors } from '@feathersjs/errors'
import { cloneDeep, get, set } from 'lodash'
import { debug } from 'feathers-hooks-common'
import { createPasswordTransform } from '../generateHooks'
import { myFeathers } from '../feather'
import mimeTypes from 'mime-types'
import toBuffer from 'concat-stream'
import { getBase64DataURI, parseDataURI } from 'dauria'
import { from } from 'from2'
import crypto from 'crypto'
import fileBlob from 'fs-blob-store'
function fromBuffer(buffer: any) {
  // assert.ok(Buffer.isBuffer(buffer))

  return from(function (size: any, next: any) {
    if (buffer.length <= 0) {
      //@ts-ignore
      return this.push(null)
    }

    const chunk = buffer.slice(0, size)
    buffer = buffer.slice(size)

    next(null, chunk)
  })
}

function bufferToHash(buffer: any) {
  const hash = crypto.createHash('sha256')
  hash.update(buffer)
  return hash.digest('hex')
}
export class UsersService extends BaseService {
  //
  returnBuffer = false
  returnUri = true
  fileModel: any
  fileId = 'id'
  serviceName?: string | undefined = 'uploads' //
  constructor(options: any) {
    super(options) //
    this.returnBuffer = options.returnBuffer || false
    this.returnUri = options.returnUri !== undefined ? options.returnUri : true
    this.fileModel = fileBlob(__dirname + '/upload')
  }
  //@ts-ignore
  async find(...args) {
    return super.find(...args)
  } //

  @useMethodTransform({
    //@ts-ignore
    password: createPasswordTransform()
  })
  @useCaptCha({})
  @useUnAuthenticate()
  create(body: any, params = {}) {
    //
    let { id, uri, buffer, contentType } = body
    if (uri) {
      const result = parseDataURI(uri)
      contentType = result.MIME
      buffer = result.buffer
    } else {
      uri = getBase64DataURI(buffer, contentType)
    }

    if (!uri && (!buffer || !contentType)) {
      throw new errors.BadRequest('Buffer or URI with valid content type must be provided to create a blob')
    }
    let ext = mimeTypes.extension(contentType)

    // Unrocognized mime type
    if (typeof ext === 'boolean' && !ext) {
      // Fallback to binary content
      ext = 'bin'
      contentType = 'application/octet-stream'
    }

    if (!id) {
      const hash = bufferToHash(buffer)
      id = `${hash}.${ext}`
    }
    return new Promise((resolve, reject) => {
      fromBuffer(buffer)
        .pipe(
          this.fileModel.createWriteStream(
            {
              key: id
              // params: params.s3
            },
            (error: any) =>
              error
                ? reject(error)
                : resolve({
                    [this.id]: id,
                    ...(this.returnBuffer && { buffer }),
                    ...(this.returnUri && { uri }),
                    size: buffer.length,
                    contentType
                  })
          )
        )
        .on('error', reject)
    })
  }
}
export default UsersService
