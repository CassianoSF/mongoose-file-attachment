import Path from 'path'
import fs from 'fs'
import { model, Schema } from 'mongoose'
import { connect, disconnect } from './connection'
import AttachmentPlugin, { Attachment, FileAttachment } from '../index'


const fileName = 'file-test'
const fixtures = Path.join('__test__', 'fixtures')
const storage = Path.join('__test__', 'storage')

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
}, {
  timestamps: {
    createdAt: 'createDate',
    updatedAt: 'updateDate',
  }
})
testSchema.plugin(AttachmentPlugin)
const TestModel = model('TestModel', testSchema, 'tests')

describe('testing create attachment', () => {
  beforeAll(async () => {
    await connect()
  })

  beforeEach(async () => {
    await TestModel.deleteMany({})
    await TestModel.create({
      foo: 'fooo',
      bar: 'baaar',
      logo0: new FileAttachment({ path: Path.join(fixtures, fileName), name: fileName, size: 1024, type: 'text' }),
      images: {
        logo1: new FileAttachment({ path: Path.join(fixtures, fileName), name: fileName, size: 1024, type: 'text' }),
        logo2: null,
      },
    })
  })

  afterAll(async () => {
    disconnect()
  })

  test('should persist document fields', async () => {
    const doc = await TestModel.findOne({})
    const storagePath = Path.join('__test__', 'storage', 'service-test', doc.id)
    const logo0Path = Path.join(storagePath, doc.logo0._id)
    const logo1Path = Path.join(storagePath, doc.images.logo1._id)
    expect(doc._id).not.toBe(null)
    expect(doc._id).not.toBe(undefined)
    expect(doc.foo).toBe('fooo')
    expect(doc.bar).toBe('baaar')
    expect(doc.logo0.size).toBe(1024)
    expect(doc.logo0.path).toBe(logo0Path)
    expect(doc.logo0.type).toBe('text')
    expect(doc.logo0.name).toBe('file-test')
    expect(doc.logo0._id).not.toBe(null)
    expect(doc.logo0._id).not.toBe(undefined)
    expect(doc.logo0.baseUrl).toBe('http://localhost:3000/attachments')
    expect(doc.logo0.serviceName).toBe('service-test')
    expect(doc.logo0.serviceId).not.toBe(null)
    expect(doc.logo0.serviceId).not.toBe(undefined)
    expect(doc.images.logo1.size).toBe(1024)
    expect(doc.images.logo1.path).toBe(logo1Path)
    expect(doc.images.logo1.type).toBe('text')
    expect(doc.images.logo1.name).toBe('file-test')
    expect(doc.images.logo1._id).not.toBe(null)
    expect(doc.images.logo1._id).not.toBe(undefined)
    expect(doc.images.logo1.baseUrl).toBe('http://localhost:3000/attachments')
    expect(doc.images.logo1.serviceName).toBe('service-test')
    expect(doc.images.logo1.serviceId).not.toBe(null)
    expect(doc.images.logo1.serviceId).not.toBe(undefined)
  })

  test('should persist files', async () => {
    const doc = await TestModel.findOne({})
    const storagePath = Path.join('__test__', 'storage', 'service-test', doc.id)
    const logo0File = Path.join(storagePath, doc.logo0._id, doc.logo0.name)
    const logo1File = Path.join(storagePath, doc.images.logo1._id, doc.images.logo1.name)
    const buff0 = fs.readFileSync(logo0File)
    const buff1 = fs.readFileSync(logo1File)
    expect(buff0.toString()).toBe('Got it!')
    expect(buff1.toString()).toBe('Got it!')
  })
})




describe('testing update attachment', () => {
  beforeAll(async () => {
    await connect()
  })

  beforeEach(async () => {
    await TestModel.deleteMany({})
  })

  afterAll(async () => {
    disconnect()
  })

  test('should update document fields', async () => {
    await TestModel.create({
      foo: 'fooo',
      bar: 'baaar',
      logo0: new FileAttachment({ path: Path.join(fixtures, fileName), name: fileName, size: 1024, type: 'text' }),
      images: {
        logo1: new FileAttachment({ path: Path.join(fixtures, fileName), name: fileName, size: 1024, type: 'text' }),
        logo2: null,
      },
    })
    await TestModel.findOneAndUpdate({}, {
      logo0: null,
      images: {
        logo1: null,
        logo2: new FileAttachment({ path: Path.join(fixtures, fileName), name: fileName, size: 1024, type: 'text' }),
      },
    })
    const doc = await TestModel.findOne({})
    const storagePath = Path.join('__test__', 'storage', 'service-test', doc.id)
    const logo2Path = Path.join(storagePath, doc.images.logo2._id)
    expect(doc._id).not.toBe(null)
    expect(doc._id).not.toBe(undefined)
    expect(doc.foo).toBe('fooo')
    expect(doc.bar).toBe('baaar')
    expect(doc.logo0).toBe(null)
    expect(doc.images.logo0).toBe(undefined)
    expect(doc.images.logo2.size).toBe(1024)
    expect(doc.images.logo2.path).toBe(logo2Path)
    expect(doc.images.logo2.type).toBe('text')
    expect(doc.images.logo2.name).toBe('file-test')
    expect(doc.images.logo2._id).not.toBe(null)
    expect(doc.images.logo2._id).not.toBe(undefined)
    expect(doc.images.logo2.baseUrl).toBe('http://localhost:3000/attachments')
    expect(doc.images.logo2.serviceName).toBe('service-test')
    expect(doc.images.logo2.serviceId).not.toBe(null)
    expect(doc.images.logo2.serviceId).not.toBe(undefined)
  })

  test('should update files', async () => {
    const originalDoc = await TestModel.create({
      foo: 'fooo',
      bar: 'baaar',
      logo0: new FileAttachment({ path: Path.join(fixtures, fileName), name: fileName, size: 1024, type: 'text' }),
      images: {
        logo1: new FileAttachment({ path: Path.join(fixtures, fileName), name: fileName, size: 1024, type: 'text' }),
        logo2: null,
      },
    })
    await TestModel.findOneAndUpdate({}, {
      logo0: null,
      images: {
        logo1: null,
        logo2: new FileAttachment({ path: Path.join(fixtures, fileName), name: fileName, size: 1024, type: 'text' }),
      },
    }, { new: true, useFindAndModify: false})
    const doc = await TestModel.findOne({})
    const storagePath = Path.join('__test__', 'storage', 'service-test', doc.id)
    const logo0File = Path.join(storagePath, originalDoc.logo0._id, originalDoc.logo0.name)
    const logo1File = Path.join(storagePath, originalDoc.images.logo1._id, originalDoc.images.logo1.name)
    const logo2File = Path.join(storagePath, doc.images.logo2._id, doc.images.logo2.name)
    const buff2 = fs.readFileSync(logo2File)
    expect(buff2.toString()).toBe('Got it!')
    const existFile = (path) => new Promise((resolve) =>
      fs.access(path, (err) => {
        if (err) return resolve(false)
        resolve(true)
      })
    )
    const logo0Exists = await existFile(logo0File)
    const logo1Exists = await existFile(logo1File)
    expect(logo0Exists).toBe(false)
    expect(logo1Exists).toBe(false)
  })
})