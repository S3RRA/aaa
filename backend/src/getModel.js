"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createModel = (name, schema, conn) => {
    const model = conn.model(name, schema);
    return model;
};
const getModel = (name, schema, conn) => {
    let model;
    if (conn.modelNames().includes(name)) {
        model = conn.model(name);
    }
    else {
        model = createModel(name, schema, conn);
    }
    return model;
};
exports.default = getModel;
