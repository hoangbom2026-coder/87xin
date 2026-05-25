import { all } from 'redux-saga/effects';
import { authSaga } from '../features/auth/authSaga';
import { adminSaga } from '../features/admin/adminSaga';

export function* rootSaga() {
  yield all([authSaga(), adminSaga()]);
}
