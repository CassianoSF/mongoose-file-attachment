import { Schema, SchemaType, Types } from 'mongoose'
import FileAttachment from './FileAttachment'

export interface Options {
  storageBasePath: string,
  serviceName: string,
  baseUrl: string
}

class Attachment extends SchemaType {
  options: { options: Options }

  constructor(key: string, options: { options: Options }) {
    super(key, options, 'Attachment')
    this.options = options
  }

  cast(val: FileAttachment) : FileAttachment {
    val._id ||= Types.ObjectId().toHexString()
    return new FileAttachment({
      ...val,
      url: this.options.options.baseUrl,
      serviceName: this.options.options.serviceName,
    })
  }
}

Schema.Types.Attachment = Attachment

export default Attachment
