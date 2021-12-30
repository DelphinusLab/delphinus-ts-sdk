import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import accountReducer from '../lib/accountSlice';

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['account/fetchAccount/fullfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.web3','payload.seed', 'payload.injector'],
        // Ignore these paths in the state
        ignoredPaths: ['account.l1Account.web3', 'account.l2Account.seed', 'account.l2Account.injector'],
      },
    }),
  reducer: {
    account: accountReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
