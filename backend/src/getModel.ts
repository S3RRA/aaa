import { Connection, Model, Schema } from "mongoose";

const createModel = (name: string, schema: Schema, conn: Connection) => {
  const model = conn.model(name, schema);
  return model;
}

const getModel = (name: string, schema: Schema, conn: Connection): any => {
  let model;
  if(conn.modelNames().includes(name)){
    model = conn.model(name);
  }
  else {
    model = createModel(name, schema, conn);
  }
  return model;
}

export default getModel;