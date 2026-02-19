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
import { baseApi } from "./api/baseApi";
import { squidApi } from "./api/squidApi";
import { getPersistStorage } from "./storage";

const themePersistConfig = {
  key: "klyra-theme",
  storage: getPersistStorage(),
  whitelist: ["themeMode", "colorThemeId", "gradientThemeId", "density", "sansFontId", "monoFontId"],
};

const persistedThemeReducer = persistReducer(themePersistConfig, themeReducer);

export const makeStore = () =>
  configureStore({
    reducer: {
      theme: persistedThemeReducer,
      navigation: navigationReducer,
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
