import { createSlice } from "@reduxjs/toolkit";

const MAX_USED_TOKENS = 20;

export interface UsedTokenEntry {
  tokenId: string;
  chainId: string;
}

interface UsedTokensState {
  entries: UsedTokenEntry[];
}

const initialState: UsedTokensState = {
  entries: [],
};

function prune(entries: UsedTokenEntry[]): UsedTokenEntry[] {
  const seen = new Set<string>();
  const out: UsedTokenEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.tokenId)) continue;
    seen.add(e.tokenId);
    out.push(e);
    if (out.length >= MAX_USED_TOKENS) break;
  }
  return out;
}

export const usedTokensSlice = createSlice({
  name: "usedTokens",
  initialState,
  reducers: {
    recordTokenUsed: (state, action: { payload: UsedTokenEntry }) => {
      const { tokenId, chainId } = action.payload;
      const next = [{ tokenId, chainId }, ...state.entries.filter((e) => e.tokenId !== tokenId)];
      state.entries = prune(next);
    },
  },
});

export const { recordTokenUsed } = usedTokensSlice.actions;
export const usedTokensReducer = usedTokensSlice.reducer;
