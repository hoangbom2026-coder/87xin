import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminState {
  settings: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  settings: null,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<any>) => {
      state.settings = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setSettings, setLoading, setError } = adminSlice.actions;
export default adminSlice.reducer;
