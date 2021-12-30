import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
//import { RootState, AppThunk } from '../app/store';
import { SubstrateAccountInfo, L1AccountInfo, BridgeMetadata } from './type';
import { loginL1Account, deriveL2Account } from "./l1/account";
import { tryLoginL2Account } from "./l2/utils";

export interface AccountState {
    l1Account?: L1AccountInfo;
    l2Account?: SubstrateAccountInfo;
    status: 'Loading' | 'L1AccountReady' | 'Ready';
}

const initialState: AccountState = {
  status: 'Loading',
};

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched. Thunks are
// typically used to make async requests.
export const loginL1AccountAsync = createAsyncThunk(
  'acccount/fetchAccount',
  async (thunkApi) => {
    let account = await loginL1Account();
    return account;
  }
);

export const loginL2AccountAsync = createAsyncThunk(
  'acccount/deriveAccount',
  async (l1account:string, thunkApi) => {
    let derived = await deriveL2Account(l1account);
    let account = await tryLoginL2Account(derived);
    /*
    await withBrowerWeb3(async (web3: DelphinusWeb3) => {
      return (web3 as Web3BrowsersMode).subscribeAccountChange(cb);
    });
    */
    return account;
  }
);

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setL1Account: (state, account) => {
      state.l1Account!.address = account.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginL1AccountAsync.pending, (state) => {
        state.status = 'Loading';
      })
      .addCase(loginL1AccountAsync.fulfilled, (state, c) => {
        state.status = 'L1AccountReady';
        console.log(c);
        state.l1Account = c.payload;
      })
      .addCase(loginL2AccountAsync.pending, (state) => {
        state.status = 'Loading';
      })
      .addCase(loginL2AccountAsync.fulfilled, (state, c) => {
        state.status = 'Ready';
        console.log(c);
        state.l2Account = c.payload;
      });
  },
});

export const selectL1Account= (state: any) => state.account.l1Account;
export const selectL2Account= (state: any) => state.account.l2Account;
export const selectLoginStatus = (state: any) => state.account.status;

export default accountSlice.reducer;
