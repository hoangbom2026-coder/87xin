import { combineReducers } from 'redux';
import authReducer from '../features/auth/authSlice';
import adminReducer from '../features/admin/adminSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  admin: adminReducer,
});
