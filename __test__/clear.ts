import * as Path from 'path'
import fs from 'fs'
import { model, Schema } from 'mongoose'
import { connect, disconnect } from './connection'

import { Attachment } from '../index'

const storage = Path.join('__test__', 'storage')

async function crear() {
  const testSchema = new Schema({
    foo: String,
    bar: String,
    logo0: {
      type: Attachment,
      options: {
        storageBasePath: storage,
        baseUrl: 'http://localhost:3000/attachments',
        serviceName: 'service-test',
      },
    },
    images: {
      logo1: {
        type: Attachment,
        options: {
          storageBasePath: storage,
          baseUrl: 'http://localhost:3000/attachments',
          serviceName: 'service-test',
        },
      },
      logo2: {
        type: Attachment,
        options: {
          storageBasePath: storage,
          baseUrl: 'http://localhost:3000/attachments',
          serviceName: 'service-test',
        },
      },
    },
  })
  const TestModel = model('TestModel', testSchema, 'tests')
  await connect()
  await TestModel.deleteMany({})
  if (fs.existsSync(Path.join(storage, 'service-test')))
    fs.rmSync(Path.join(storage, 'service-test'), { recursive: true })
  disconnect()
}

crear()