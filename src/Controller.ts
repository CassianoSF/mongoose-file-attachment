/* eslint-disable class-methods-use-this */
import {Document, Schema, SchemaType, Types, UpdateQuery, UpdateWithAggregationPipeline} from 'mongoose'
import * as Path from 'path'
import Storage from './Storage'
import FileAttachment from './FileAttachment'
import {AttachCallback, AttachData} from './AttachData'

interface CustomSchema extends Schema {
  subpaths?: Record<string, SchemaType>
}

export default class Controller {
  schema: CustomSchema

  constructor(schema: CustomSchema) {
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
          promises.push(mkCb(new AttachData({
            data: modifiedDoc[key],
            options: schemaObj[key].options,
            path: '',
          })))
        }
        if (modifiedDoc[key] === null) {
          if (!schemaObj[key]) return
          promises.push(rmCb(new AttachData({
            data: originalDoc[key],
            options: schemaObj[key].options,
            path: '',
          })))
        }
        if (typeof modifiedDoc[key] === 'object') {
          if (Array.isArray(modifiedDoc[key])) {
            modifiedDoc[key].forEach((item, idx) => {
              if (['FileAttachment', 'File'].includes(modifiedDoc[key][idx]?.constructor?.name)) {
                const modified = item as FileAttachment
                const original = originalDoc[key][idx] as FileAttachment | undefined
                if (original) {
                  if (original.equals(modified)) {
                    return
                  } else {
                    promises.push(rmCb(new AttachData({
                      data: original,
                      options: schemaObj[key][0].options,
                      path: '',
                    })))
                  }
                }
                promises.push(mkCb(new AttachData({
                  data: modified,
                  options: schemaObj[key][0].options,
                  path: '',
                })))
              }
            })
          } else {
            promises.push(
              ...this.updateFileAttachments(
                originalDoc[key], modifiedDoc[key], schemaObj[key], rmCb, mkCb,
              ),
            )
          }
        }
      })
    }
    return promises
  }

  private findAttachments(doc?: Document): AttachData[] {
    const paths = Object.values(this.schema.paths)
    if (this.schema.subpaths) {
      paths.push(...Object.values(this.schema.subpaths))
    }
    const attachs = paths.filter((path) => path.instance === 'Attachment')

    return attachs.map((attachment) => {
      const docPath = attachment.path.endsWith('.$') ? attachment.path.split('.')[0] : attachment.path
      const docData = doc && (typeof doc.get === 'function' ? doc.get(docPath) : doc[docPath])
      if (Array.isArray(docData)) {
        return docData.map((data, idx) => new AttachData({
          data,
          options: attachment.options.options,
          path: attachment.path.replace(/\$$/, String(idx)),
        }))
      } else {
        return new AttachData({
          data: docData,
          options: attachment.options.options,
          path: attachment.path,
        })
      }
    }).flat()
  }

  findAttachment(doc: Document, id: string): AttachData | undefined {
    const attachments = this.findAttachments(doc)
    return attachments.find((at) => at.data && !Array.isArray(at.data) && at.data._id === id)
  }

  private async saveFile(attachment: AttachData, doc: Document): Promise<void> {
    if (!attachment.data) return
    if (Array.isArray(attachment.data)) {
      await Promise.all(
        attachment.data.map((data) => {
          const attach = new AttachData({
            ...attachment,
            data,
          })
          return this.saveFile(attach, doc)
        }),
      )
    } else {
      attachment.data.serviceId = doc.id
      attachment.data._id = Types.ObjectId().toHexString()
      const srcPath = attachment.data.path
      const storage = Storage.from(attachment, doc)
      attachment.data.path = Path.join(storage.storagePath, attachment.data._id)
      await storage.fsMkdir(attachment.data._id)
      await storage.fsCopy(srcPath, Path.join(attachment.data._id, attachment.data.name))
    }
  }

  private async removeFile(attachment: AttachData, doc: Document): Promise<void> {
    if (!attachment.data) return
    if (Array.isArray(attachment.data)) {
      await Promise.all(
        attachment.data.map((data) => {
          const attach = new AttachData({
            ...attachment,
            data,
          })
          return this.removeFile(attach, doc)
        }),
      )
    } else {
      if (!attachment.data._id) return
      const storage = Storage.from(attachment, doc)
      const filePath = Path.join(attachment.data._id, attachment.data.name)
      await storage.fsRemove(filePath)
      await storage.fsRmdir(attachment.data._id)
    }
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
    const modifiedPaths = modified.modifiedPaths({includeChildren: true})
      .filter((path) => oldAttachments.some((oa) => oa.path === path)
        || newAttachments.some((na) => na.path === path))

    const promises = modifiedPaths.map(async (path) => {
      const oldAttachment = oldAttachments.find((oa) => oa.path === path)
      const newAttachment = newAttachments.find((na) => na.path === path)
      if (oldAttachment && newAttachment) {
        if (oldAttachment.equals(newAttachment)) {
          // Se forem iguais, não faz nada ...
          return
        } else {
          // senão, remove o antigo
          if (oldAttachment.data) {
            await this.removeFile(oldAttachment, original)
          }
        }
      }
      if (newAttachment && newAttachment.data) {
        // Salva o novo, se o antigo não existir ou for diferente
        await this.saveFile(newAttachment, modified)
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
    const attachmentsDoc = docs.map(doc => ({attachments: this.findAttachments(doc), doc})).flat(2)
    const storagesMap: { [key: string]: Storage } = {}
    attachmentsDoc.forEach(({attachments, doc}) => {
      attachments.forEach(attachment => {
        storagesMap[attachment.options.storageBasePath] = Storage.from(attachment, doc)
      })
    })
    const storages = Object.values(storagesMap)
    const promises = storages.map(storage => storage.rmStorage())
    return Promise.all(promises)
  }
}
