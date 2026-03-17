import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { themeReducer } from "./slices/themeSlice";
import { navigationReducer } from "./slices/navigationSlice";
import { usedTokensReducer } from "./slices/usedTokensSlice";
import { baseApi } from "./api/baseApi";
import { squidApi } from "./api/squidApi";
import { getPersistStorage } from "./storage";
import { getUsedTokensCookieStorage } from "@/lib/cookie";

const themePersistConfig = {
  key: "morapay-theme",
  storage: getPersistStorage(),
  whitelist: ["themeMode", "colorThemeId", "gradientThemeId", "density", "sansFontId", "monoFontId"],
};

const usedTokensPersistConfig = {
  key: "morapay-used-tokens",
  storage: getUsedTokensCookieStorage(),
  whitelist: ["entries"],
};

const persistedThemeReducer = persistReducer(themePersistConfig, themeReducer);
const persistedUsedTokensReducer = persistReducer(usedTokensPersistConfig, usedTokensReducer);

export const makeStore = () =>
  configureStore({
    reducer: {
      theme: persistedThemeReducer,
      navigation: navigationReducer,
      usedTokens: persistedUsedTokensReducer,
      [baseApi.reducerPath]: baseApi.reducer,
      [squidApi.reducerPath]: squidApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(baseApi.middleware, squidApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
