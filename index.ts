/* eslint-disable @typescript-eslint/no-namespace */
import FileAttachment from './src/FileAttachment'
import AttachmentType from './src/Attachment'
import Controller from './src/Controller'
import Storage from './src/Storage'
import AttachmentPlugin from './src/Plugin'

export {
  FileAttachment,
  Controller,
  Storage,
  AttachmentType as Attachment,
}

export default AttachmentPlugin

declare module 'mongoose' {
  export interface SchemaType {
    instance: string
    path: string
    options: any
  }

  export namespace Schema {
    export namespace Types {
      export class Attachment extends SchemaType {
      }
    }
  }

  interface Document {
    $originalDoc: this | undefined
  }
}
