import express from 'express';
import * as dotenv from 'dotenv';
import routes from './index.routes';

dotenv.config();
const app = express();

app.set('port', 3000);
console.log('App listening on port 3000');

app.use(express.json());
app.use(express.urlencoded());

app.listen(3000);

app.use('/', routes);