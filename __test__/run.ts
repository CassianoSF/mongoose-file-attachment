import * as Path from 'path'
import { model, Schema } from 'mongoose'
import { connect, disconnect } from './connection'

import AttachmentPlugin, { Attachment, FileAttachment } from '../index'

const fileName = 'file-test'
const fixtures = Path.join('__test__', 'fixtures')
const storage = Path.join('__test__', 'storage')

async function runTest() {
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
  testSchema.plugin(AttachmentPlugin)
  const TestModel = model('TestModel', testSchema, 'tests')
  await connect()
  await TestModel.deleteMany({})


  const test = await TestModel.create({
    foo: 'fooo',
    bar: 'baaar',
    logo0: new FileAttachment({
      path: fixtures,
      name: fileName,
    }),
    images: {
      logo1: new FileAttachment({ path: fixtures, name: fileName }),
      logo2: null,
    },
  })

  const doc = await TestModel.findOne(test._id)
  console.log(doc)

  const updateTest = await TestModel.findOneAndUpdate({ _id: test._id }, {
    foo: 'fooo',
    bar: 'baaar',
    logo0: null,
    images: {
      logo2: new FileAttachment({ path: fixtures, name: fileName }),
    },
  }, { new: true })
  console.log('UPDATE')
  console.log(updateTest)

  const find = await TestModel.findOne(test._id)
  console.log('FIND')
  console.log(find)

  await TestModel.deleteMany({})
  console.log('DELETED', await TestModel.find({}))
  disconnect()
}

runTest()
