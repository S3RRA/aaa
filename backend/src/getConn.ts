import { Connection, ConnectOptions } from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const mongoose = require('mongoose');

//Old mongoose version
const options: ConnectOptions = {
  /*useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  autoIndex: true,
  poolSize: 15,
  bufferMaxEntries: 0,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 30000*/
};

const createConn = (dbName: string) => {
  const uri = `mongodb://${ process.env.COSMOSDB_USER }:${ process.env.COSMOSDB_SECRET }==@${ process.env.COSMOSDB_HOST }:${ process.env.COSMOSDB_PORT }/${ dbName }?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@smart4p-cosmos@`
  return mongoose.createConnection(uri, options);
}

const getConn = (dbName: string) => {
  let [ conn ] = mongoose.connections.filter((conn: any) => conn.name === dbName);
  if(!conn) {
    conn = createConn(dbName);
  }
  return conn;
}

export default getConn;