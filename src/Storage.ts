import { Document } from 'mongoose'
import fs from 'fs'
import * as Path from 'path'
import { AttachData } from './Controller'

class Storage {
  storagePath: string

  constructor(storagePath: string) {
    this.storagePath = storagePath
  }

  static from(attachment: AttachData, doc: Document): Storage {
    return new Storage(
      Path.join(
        attachment.options.storageBasePath,
        attachment.options.serviceName,
        doc.id || doc._id.toHexString(),
      ),
    )
  }

  fsMkdir(path: string): Promise<void> {
    return new Promise((resolve, reject) =>
      fs.mkdir(Path.join(this.storagePath, path), { recursive: true }, (err) => {
        if (err) return reject(err)
        resolve()
      })
    )
  }

  fsRmdir(path: string): Promise<void> {
    return new Promise((resolve, reject) =>
      fs.access(Path.join(this.storagePath, path), (err) => {
        if (err) return resolve()
        fs.rmdir(Path.join(this.storagePath, path), (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    )
  }

  fsRemove(path: string): Promise<void> {
    return new Promise((resolve, reject) =>
      fs.unlink(Path.join(this.storagePath, path), (err) => {
        if (err) return reject(err)
        resolve()
      })
    )
  }

  fsCopy(srcPath: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const rd = fs.createReadStream(srcPath)
      rd.on('error', (err) => err && reject(err))
      const wr = fs.createWriteStream(Path.join(this.storagePath, destPath))
      wr.on('error', (err) => err && reject(err))
      wr.on('close', () => resolve())
      rd.pipe(wr)
    })
  }


  rmStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.readdir(this.storagePath, (err, files) => {
        if (err) return reject(err)
        if (files.length) return resolve();
        fs.access(this.storagePath, (err) => {
          if (err) return resolve()
          fs.rmdir(this.storagePath, (err) => {
            if (err) return reject(err)
            resolve()
          })
        })
      })
    })
  }
}

export default Storage
