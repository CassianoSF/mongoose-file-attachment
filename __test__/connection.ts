import mongoose from "mongoose"

function connect(): Promise<typeof mongoose> {
  return mongoose.connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
}

function disconnect(): Promise<void> {
  return mongoose.connection.close()
}

export { connect, disconnect }
