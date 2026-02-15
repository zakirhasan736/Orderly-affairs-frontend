import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NextKinState {
  list: any[];
  loading: boolean;
}

const initialState: NextKinState = {
  list: [],
  loading: false,
};

const nextKinSlice = createSlice({
  name: 'nextKin',
  initialState,
  reducers: {
    setNextKinList(state, action: PayloadAction<any[]>) {
      state.list = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setNextKinList, setLoading } = nextKinSlice.actions;
export default nextKinSlice.reducer;
