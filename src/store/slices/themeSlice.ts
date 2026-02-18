import { createSlice } from "@reduxjs/toolkit";
import type {
  ThemeMode,
  ResolvedTheme,
  ColorThemeId,
  GradientThemeId,
  DensityScale,
  SansFontId,
  MonoFontId,
} from "@/types/theme";
import { DEFAULT_SANS_FONT_ID, DEFAULT_MONO_FONT_ID } from "@/config/fontPresets";

export interface ThemeState {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colorThemeId: ColorThemeId;
  gradientThemeId: GradientThemeId;
  density: DensityScale;
  sansFontId: SansFontId;
  monoFontId: MonoFontId;
}

const initialState: ThemeState = {
  themeMode: "system",
  resolvedTheme: "light",
  colorThemeId: "default",
  gradientThemeId: "default",
  density: "normal",
  sansFontId: DEFAULT_SANS_FONT_ID,
  monoFontId: DEFAULT_MONO_FONT_ID,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode: (state, action: { payload: ThemeMode }) => {
      state.themeMode = action.payload;
    },
    setResolvedTheme: (state, action: { payload: ResolvedTheme }) => {
      state.resolvedTheme = action.payload;
    },
    setColorThemeId: (state, action: { payload: ColorThemeId }) => {
      state.colorThemeId = action.payload;
    },
    setGradientThemeId: (state, action: { payload: GradientThemeId }) => {
      state.gradientThemeId = action.payload;
    },
    setDensity: (state, action: { payload: DensityScale }) => {
      state.density = action.payload;
    },
    setSansFontId: (state, action: { payload: SansFontId }) => {
      state.sansFontId = action.payload;
    },
    setMonoFontId: (state, action: { payload: MonoFontId }) => {
      state.monoFontId = action.payload;
    },
  },
});

export const {
  setThemeMode,
  setResolvedTheme,
  setColorThemeId,
  setGradientThemeId,
  setDensity,
  setSansFontId,
  setMonoFontId,
} = themeSlice.actions;

export const themeReducer = themeSlice.reducer;
