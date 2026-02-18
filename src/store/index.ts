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
import { baseApi } from "./api/baseApi";
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
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
