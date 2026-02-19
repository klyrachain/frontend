// components/Layout/RightSidebar.tsx
import { FC } from "react";
// import { Card } from "@/components/ui/card";

export const RightSidebar: FC<{ className?: string }> = ({ className }) => {
  return (
    <aside className={className}>
      {/* <Card className="p-4"> */}
      <h2 className="text-lg font-semibold mb-2">Settings</h2>
      {/* Your settings controls here */}
      <div className="space-y-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" className="form-checkbox" />
          <span>Enable notifications</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" className="form-checkbox" />
          <span>Dark mode</span>
        </label>
      </div>
      {/* </Card> */}
    </aside >
  );
};