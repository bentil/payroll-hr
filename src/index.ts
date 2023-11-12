import dotenv from 'dotenv';
dotenv.config();

import startApp from './app';
import config from './config';

startApp(config.port);