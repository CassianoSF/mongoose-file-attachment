# mongoose-file-attachment

[![][npmv-img]][npmv-url] [![][license-img]][license-url] [![][build-img]][build-url]

[![][npm-weekly-img]][npmv-url] [![][npm-monthly-img]][npmv-url]
[![][npm-yearly-img]][npmv-url] [![][npm-alltime-img]][npmv-url]

* [Install](#Install)
* [Usage](#usage)

## Install

This project requires `mongoose >= 5.12.12` and `formidable >= ^1.2.2`. Install them using [yarn](https://yarnpkg.com)
or [npm](https://npmjs.com).

```shell
$ npm install mongoose-file-attachment
```

or with yarn

```shell
$ yarn add mongoose-file-attachment
```

## Examples

### with express.js + formidable

```typescript
import express from 'express'
import formidable from 'formidable'
import mongoose from 'mongoose'
import AttachmentPlugin from 'mongoose-file-attachment' // ALWAYS after mongoose

mongoose.Schema.Types.Attachment = AttachmentPlugin.Attachment
mongoose.plugin(AttachmentPlugin)

const schema = new mongoose.Schema({
  title: String,
  file: {
    type: AttachmentPlugin.Attachment,
    options: {
      storageBasePath: 'example-storage',
      baseUrl: 'http://localhost:3000/files',
      serviceName: 'examples'
    }
  }
})
const Example = new mongoose.model('example', schema, 'examples')
const app = express();

app.get('/', (req, res) => {
  res.send(`
    <h2>With <code>"express"</code> npm package</h2>
    <form action="/api/upload" enctype="multipart/form-data" method="post">
      <div>Text field title: <input type="text" name="title" /></div>
      <div>File: <input type="file" name="someFile" /></div>
      <input type="submit" value="Upload" />
    </form>
  `);
});

app.post('/api/upload', (req, res, next) => {
  const form = formidable({ multiples: true });

  form.parse(req, (err, fields, files) => {
    if (err) return next(err)

    Example.create({
      title: fields.title,
      file: new AttachmentPlugin.FileAttachment(file.someFile)
    }, (err, obj) => {
      if (err) return next(err)

      res.json(obj);
    })
  });
});

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000 ...');
});
```

## API

### AttachmentPlugin

The plugin to be added on mongoose. It must be used on init of the application, and together
to [Attachment](#attachment).

```js
import mongoose from 'mongoose'
import AttachmentPlugin from 'mongoose-file-attachment'

mongoose.plugin(AttachmentPlugin)
```

### Attachment

The type of Mongoose document properties. It must be used on init of the application, and together
to [AttachmentPlugin](#attachmentplugin).

```js
import mongoose from 'mongoose'
import { Attachment } from 'mongoose-file-attachment'

mongoose.Schema.Types.Attachment = Attachment
```

The Schema definition must have the property [`options`](#options), when type is `Attachment`.

#### options

All these properties are required.

- `options.storageBasePath` **{string}** - The path where the files will be stored.
- `options.baseUrl` **{string}** - The application base URL to retrieve the file.
- `options.serviceName` **{string}** - The collection name.

```js
import { Schema } from 'mongoose'
import { Attachment } from 'mongoose-file-attachment'

const schema = new Schema({
  title: {
    type: String
  },
  firstFile: {
    type: Schema.Types.Attachment, // <-- this way
    options: {
      storageBasePath: '/path/to/storage',
      baseUrl: 'http://my-app.com/files',
      serviceName: 'examples'
    }
  },
  secondFile: {
    type: Attachment, // <-- or this way
    options: {
      storageBasePath: '/path/to/storage',
      baseUrl: 'http://my-app.com/files',
      serviceName: 'examples'
    }
  }
})
```

### FileAttachment

The class that must be passed on object creation.

```js
import { FileAttachment } from 'mongoose-file-attachment'

const attachment = new FileAttachment(file)
```

#### file

Can be a `formidable.File` object or an object whith these options:

- `file.path` **{string}** - The path to the file.
- `file.size` **{number}** - defaults `undefined`; The file size in bytes.
- `file.type` **{number}** - defaults `undefined`; The file MIME type.
- `file.name` **{string}** - defaults `NO_NAME`; The original file name.

## License

mongoose-file-attachment is licensed under the [MIT License][license-url].

<!-- LINKS -->

[npmv-img]: https://badgen.net/npm/v/mongoose-file-attachment?icon=npm

[npmv-url]: https://npmjs.org/package/mongoose-file-attachment

[npm-weekly-img]: https://badgen.net/npm/dw/mongoose-file-attachment?icon=npm&cache=300

[npm-monthly-img]: https://badgen.net/npm/dm/mongoose-file-attachment?icon=npm&cache=300

[npm-yearly-img]: https://badgen.net/npm/dy/mongoose-file-attachment?icon=npm&cache=300

[npm-alltime-img]: https://badgen.net/npm/dt/mongoose-file-attachment?icon=npm&cache=300&label=total%20downloads

[license-img]: https://badgen.net/npm/license/mongoose-file-attachment

[license-url]: https://github.com/CassianoSF/mongoose-file-attachment/blob/master/package.json

[build-img]: https://badgen.net/github/checks/CassianoSF/mongoose-file-attachment?cache=300&icon=github

[build-url]: https://github.com/CassianoSF/mongoose-file-attachment/actions
