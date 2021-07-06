/* eslint-disable class-methods-use-this */
import { Document, Schema, Types, UpdateQuery, UpdateWithAggregationPipeline, } from 'mongoose'
import * as Path from 'path'
import Storage from './Storage'
import FileAttachment from './FileAttachment'
import { Options } from './Attachment'

export interface AttachData {
  data: FileAttachment,
  options: Options
}

interface AttachCallback {
  ({
    data,
    options,
  }: AttachData): Promise<void>
}

export default class Controller {
  schema: Schema

  constructor(schema: Schema) {
    this.schema = schema
  }

  private updateFileAttachments(
    originalDoc: Document,
    modifiedDoc: UpdateQuery<FileAttachment> | UpdateWithAggregationPipeline | null,
    schemaObj: any,
    rmCb: AttachCallback,
    mkCb: AttachCallback,
  ): Promise<void>[] {
    const promises: Promise<void>[] = []
    if (modifiedDoc && typeof modifiedDoc === 'object') {
      if (Array.isArray(modifiedDoc)) {
        Object.keys(modifiedDoc).map((key) =>
          promises.push(
            ...this.updateFileAttachments(
              originalDoc[key], modifiedDoc[key], schemaObj[key], rmCb, mkCb,
            ),
          ))
      }
      Object.keys(modifiedDoc).forEach((key) => {
        if (schemaObj == undefined) return
        if (['FileAttachment', 'File'].includes(modifiedDoc[key]?.constructor?.name)) {
          promises.push(mkCb({
            data: modifiedDoc[key],
            options: schemaObj[key].options,
          }))
        }
        if (modifiedDoc[key] === null) {
          if (!schemaObj[key]) return
          promises.push(rmCb({
            data: originalDoc[key],
            options: schemaObj[key].options,
          }))
        }
        if (typeof modifiedDoc[key] === 'object') {
          promises.push(
            ...this.updateFileAttachments(
              originalDoc[key], modifiedDoc[key], schemaObj[key], rmCb, mkCb,
            ),
          )
        }
      })
    }
    return promises
  }

  private findAttachments(doc?: Document): {
    data: FileAttachment
    options: Options
    path: string
  }[] {
    const paths = Object.values(this.schema.paths)
    const attachs = paths.filter((path) => path.instance === 'Attachment')
    return attachs.map((attachment) => ({
      data: doc && (typeof doc.get === 'function' ? doc.get(attachment.path) : doc[attachment.path]),
      options: attachment.options.options,
      path: attachment.path,
    }))
  }

  findAttachment(doc: Document, id: string): {
    data: FileAttachment;
    options: Options;
    path: string;
  } | undefined {
    const attachments = this.findAttachments(doc)
    return attachments.find((at) => at.data && at.data._id === id)
  }

  private async saveFile(attachment: AttachData, doc: Document): Promise<void> {
    if (!attachment.data) return
    attachment.data.serviceId = doc.id
    attachment.data._id = Types.ObjectId().toHexString()
    const srcPath = attachment.data.path
    const storage = Storage.from(attachment, doc)
    attachment.data.path = Path.join(storage.storagePath, attachment.data._id)
    await storage.fsMkdir(attachment.data._id)
    await storage.fsCopy(srcPath, Path.join(attachment.data._id, attachment.data.name))
  }

  private async removeFile(attachment: AttachData, doc: Document): Promise<void> {
    if (!attachment.data || !attachment.data._id) return
    const storage = Storage.from(attachment, doc)
    const filePath = Path.join(attachment.data._id, attachment.data.name)
    await storage.fsRemove(filePath)
    await storage.fsRmdir(attachment.data._id)
  }

  saveAttachments(doc: Document): Promise<void[]> {
    const attachments = this.findAttachments(doc)
    const promises = attachments.map(async (attachment) => this.saveFile(attachment, doc))
    return Promise.all(promises)
  }

  updateAttachments(
    doc: Document,
    modified: UpdateQuery<FileAttachment> | UpdateWithAggregationPipeline | null,
  ): Promise<void[]> {
    const mkCb = (attachment: AttachData): Promise<void> =>
      this.saveFile(attachment, doc)

    const rmCb = (attachment: AttachData): Promise<void> =>
      this.removeFile(attachment, doc)

    const schemaObj = this.schema.obj
    const promises = this.updateFileAttachments(doc, modified, schemaObj, rmCb, mkCb)
    return Promise.all(promises)
  }

  updateAttachmentsOnSave(original: Document, modified: Document): Promise<void[]> {
    const oldAttachments = this.findAttachments(original)
    const newAttachments = this.findAttachments(modified)
    const modifiedPaths = modified.modifiedPaths({ includeChildren: true })
      .filter((path) => oldAttachments.some((oa) => oa.path === path))

    const promises = modifiedPaths.map(async (path) => {
      const oldAttachment = oldAttachments.find((oa) => oa.path === path)
      const newAttachment = newAttachments.find((na) => na.path === path)
      if (oldAttachment && newAttachment) {
        if (oldAttachment.data) {
          await this.removeFile(oldAttachment, original)
        }
        if (newAttachment.data) {
          await this.saveFile(newAttachment, modified)
        }
      }
    })
    return Promise.all(promises)
  }

  removeAttachments(doc: Document): Promise<void[]> {
    const attachments = this.findAttachments(doc)
    const promises = attachments.map((attachment) =>
      this.removeFile(attachment, doc))
    return Promise.all(promises)
  }

  removeStorages(doc: Document): Promise<void[]> {
    const attachments = this.findAttachments(doc)
    const storagesMap: { [key: string]: Storage } = attachments.reduce((storages, attachment) => {
      storages[attachment.options.storageBasePath] ||= Storage.from(attachment, doc)
      return storages
    }, {})
    const storages = Object.values(storagesMap)
    const promises = storages.map(storage => storage.rmStorage())
    return Promise.all(promises)
  }

  removeManyStorages(docs: Document[]): Promise<void[]> {
    const attachmentsDoc = docs.map(doc => ({ attachments: this.findAttachments(doc), doc })).flat(2)
    const storagesMap: { [key: string]: Storage } = {}
    attachmentsDoc.forEach(({ attachments, doc }) => {
      attachments.forEach(attachment => {
        storagesMap[attachment.options.storageBasePath] = Storage.from(attachment, doc)
      })
    })
    const storages = Object.values(storagesMap)
    const promises = storages.map(storage => storage.rmStorage())
    return Promise.all(promises)
  }
}
