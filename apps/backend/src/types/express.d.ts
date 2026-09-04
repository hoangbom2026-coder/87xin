import { IUser } from '@main/models/user.model';

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
