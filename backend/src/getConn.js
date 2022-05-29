"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const mongoose = require('mongoose');
//Old mongoose version
const options = {
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
const createConn = (dbName) => {
    const uri = `mongodb://${process.env.COSMOSDB_USER}:${process.env.COSMOSDB_SECRET}==@${process.env.COSMOSDB_HOST}:${process.env.COSMOSDB_PORT}/${dbName}?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@smart4p-cosmos@`;
    return mongoose.createConnection(uri, options);
};
const getConn = (dbName) => {
    let [conn] = mongoose.connections.filter((conn) => conn.name === dbName);
    if (!conn) {
        conn = createConn(dbName);
    }
    return conn;
};
exports.default = getConn;
