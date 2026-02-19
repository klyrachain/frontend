import { createSlice } from "@reduxjs/toolkit";
import type { TabId } from "@/types/navigation";
import { DEFAULT_TAB_ID } from "@/config/navigation";

export interface NavigationState {
  activeTabId: TabId;
  exchangeModalOpen: boolean;
}

const initialState: NavigationState = {
  activeTabId: DEFAULT_TAB_ID,
  exchangeModalOpen: false,
};

const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    setActiveTab: (state, action: { payload: TabId }) => {
      state.activeTabId = action.payload;
    },
    setExchangeModalOpen: (state, action: { payload: boolean }) => {
      state.exchangeModalOpen = action.payload;
    },
  },
});

export const { setActiveTab, setExchangeModalOpen } = navigationSlice.actions;
export const navigationReducer = navigationSlice.reducer;
