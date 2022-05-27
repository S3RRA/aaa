import express from 'express';
import routes from './index.routes';

const app = express();

app.use('/', routes);