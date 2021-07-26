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
      // TODO: Permitir para Array
      if (attachment && !Array.isArray(attachment)) {
        return attachment
      }
    }
  }
  return undefined
}

export {getFile}
