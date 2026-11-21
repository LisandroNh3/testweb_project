import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { loginValidator } from './auth.validator.js';
import * as controller from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', validate(loginValidator), controller.login);
authRouter.get('/me', authenticate, controller.me);
