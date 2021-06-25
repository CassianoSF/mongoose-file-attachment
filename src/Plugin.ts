/* eslint-disable func-names */
import { Document, Schema } from 'mongoose'
import Controller from './Controller'

const attachmentPlugin = (schema: Schema<Document>): void => {
  schema.post('init', async (doc) => {
    doc.$originalDoc = doc.toObject()
  })

  schema.pre('save', async function (next) {
    const controller = new Controller(schema)
    if (!this.isNew) {
      const { $originalDoc } = this
      if ($originalDoc) {
        const fields = this.modifiedPaths({ includeChildren: true })
        await controller.updateAttachmentsOnSave($originalDoc, fields)
      }
    }
    await controller.saveAttachments(this)
    next()
  })

  schema.pre('deleteOne', { document: true }, async function (next) {
    const controller = new Controller(schema)
    await controller.removeAttachments(this)
    next()
  })

  schema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
    const controller = new Controller(schema)
    const modified = this.getUpdate()
    const docs = await this.find()
    const promises = docs.map((doc) => controller.updateAttachments(doc, modified))
    await Promise.all(promises)
    await this.exec()
    next()
  })

  schema.pre(['deleteMany', 'findOneAndDelete'], async function (next) {
    const controller = new Controller(schema)
    const docs = await this.find()
    const promises = docs.map((doc) => controller.removeAttachments(doc))
    await Promise.all(promises)
    next()
  })
}

export default attachmentPlugin
