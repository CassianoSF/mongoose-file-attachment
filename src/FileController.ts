import FileAttachment from './FileAttachment'
import mongoose from 'mongoose'
import Controller from './Controller'

async function getFile(mongooseInstance: typeof mongoose, serviceName: string, serviceId: string, id: string): Promise<FileAttachment | undefined> {

  const model = Object.values(mongooseInstance.models)
    .find((m) => m.collection.collectionName === serviceName)

  if (model) {
    const document = await model.findById(serviceId)
    if (document) {
      const attachmentController = new Controller(model.schema)
      const attachment = attachmentController.findAttachment(document, id)?.data
      if (attachment) {
        if (Array.isArray(attachment)) {
          return attachment.find((attach) => attach._id === id)
        }
        return attachment
      }
    }
  }
  return undefined
}

export {getFile}
