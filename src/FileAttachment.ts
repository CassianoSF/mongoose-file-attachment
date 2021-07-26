import {File} from 'formidable'

interface IFileAttachment {
  _id?: string | undefined
  url?: string | undefined
  type?: string | null
  size?: number | undefined
  serviceName?: string
  serviceId?: string
  path: string
  name: string
}

interface FileAttachmentJSON {
  name: string
  size?: number
  type?: string | null
  url: string
}

export default class FileAttachment implements IFileAttachment {
  _id?: string | undefined

  private readonly baseUrl?: string | undefined

  type?: string | undefined

  size?: number | undefined

  serviceName?: string

  serviceId?: string

  path: string

  name: string

  constructor(file: IFileAttachment | File) {
    this.size = file.size
    this.path = file.path
    this.type = file.type || undefined // remover o Null do tipo
    this.name = file.name || 'NO_NAME'

    this._id = '_id' in file ? file._id : undefined
    this.baseUrl = 'url' in file ? file.url : undefined
    this.serviceName = 'serviceName' in file ? file.serviceName : undefined
    this.serviceId = 'serviceId' in file ? file.serviceId : undefined
  }

  get url(): string {
    return `${this.baseUrl}/${this.serviceName}/${this.serviceId}/${this._id}`
  }

  equals(b: FileAttachment): boolean {
    return (
      this._id === b._id
      && this.serviceName === b.serviceName
      && this.serviceId === b.serviceId
      && this.baseUrl === b.baseUrl
      && this.name === b.name
      && this.size === b.size
      && this.type === b.type
    )
  }

  toJSON?(): FileAttachmentJSON {
    return {
      name: this.name,
      size: this.size,
      type: this.type,
      url: this.url,
    }
  }
}
