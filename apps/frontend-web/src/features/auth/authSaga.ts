/**
 * Redux-Saga effects for player authentication.
 * Handles async login, logout, and user profile fetching.
 */
import { all, call, put, takeLatest } from 'redux-saga/effects';
import * as authService from '../../services/authService';
import { setLoading, setUser, setToken, setError, logout as logoutAction } from './authSlice';

// Action type constants
export const AUTH_ACTIONS = {
  LOGIN_REQUEST: 'auth/loginRequest',
  LOGOUT_REQUEST: 'auth/logoutRequest',
  FETCH_PROFILE_REQUEST: 'auth/fetchProfileRequest',
};

// Action creators for dispatching from UI components
export const loginRequest = (payload: { username: string; password: string }) => ({
  type: AUTH_ACTIONS.LOGIN_REQUEST,
  payload,
});

export const logoutRequest = () => ({
  type: AUTH_ACTIONS.LOGOUT_REQUEST,
});

export const fetchProfileRequest = () => ({
  type: AUTH_ACTIONS.FETCH_PROFILE_REQUEST,
});

// Login saga worker
function* handleLogin(action: { type: string; payload: { username: string; password: string } }): Generator<any, void, any> {
  yield put(setLoading(true));
  try {
    const { username, password } = action.payload;
    const result: Awaited<ReturnType<typeof authService.login>> = yield call(
      authService.login,
      username,
      password
    );
    if (result.success && result.data?.token) {
      yield put(setToken(result.data.token));
      yield put(setUser(result.data.user ?? null));
    } else {
      yield put(setError(result.message ?? 'Đăng nhập thất bại'));
    }
  } catch (err: any) {
    yield put(setError(err?.message ?? 'Lỗi kết nối máy chủ'));
  } finally {
    yield put(setLoading(false));
  }
}

// Logout saga worker
function* handleLogout(): Generator<any, void, any> {
  yield call(authService.logout);
  yield put(logoutAction());
}

// Fetch profile saga worker
function* handleFetchProfile(): Generator<any, void, any> {
  try {
    const result: Awaited<ReturnType<typeof authService.getProfile>> = yield call(
      authService.getProfile
    );
    if (result.success && result.data) {
      yield put(setUser(result.data));
    }
  } catch (_) {
    // Fail silently on profile check
  }
}

// Watchers
function* watchLogin() {
  yield takeLatest(AUTH_ACTIONS.LOGIN_REQUEST, handleLogin);
}

function* watchLogout() {
  yield takeLatest(AUTH_ACTIONS.LOGOUT_REQUEST, handleLogout);
}

function* watchFetchProfile() {
  yield takeLatest(AUTH_ACTIONS.FETCH_PROFILE_REQUEST, handleFetchProfile);
}

export function* authSaga() {
  yield all([watchLogin(), watchLogout(), watchFetchProfile()]);
}
