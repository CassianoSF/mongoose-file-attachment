import FileAttachment from './FileAttachment'
import { Options } from './Attachment'

interface IAttachData {
  data: FileAttachment | FileAttachment[]
  options: Options
  path: string
}

export class AttachData implements IAttachData {
  data: FileAttachment | FileAttachment[]
  options: Options
  path: string

  constructor(attach: IAttachData) {
    this.data = attach.data
    this.options = attach.options
    this.path = attach.path
  }

  equals(b: AttachData): boolean {
    let fileEquals = false
    if (Array.isArray(this.data) && Array.isArray(b.data)) {
      if (this.data.length === b.data.length) {
        let res = true
        this.data.forEach((data) => {
          res &&= (b.data as FileAttachment[]).some((f) => f.equals(data))
        })
        fileEquals = res
      }
    } else {
      if (this.data && b.data) {
        fileEquals = (this.data as FileAttachment).equals(b.data as FileAttachment)
      } else {
        fileEquals = false
      }
    }
    return fileEquals
      && this.options === b.options
      && this.path === b.path
  }
}

export interface AttachCallback {
  ({
    data,
    options,
  }: AttachData): Promise<void>
}
