import React, { createContext, useContext, ReactNode } from "react";
import {
  useGroupLogic,
  GroupLogicReturn,
  ActionTypes,
} from "@/context/GroupContext/groupContextLogic";

interface GroupProviderProps {
  children: ReactNode;
  groupId: string;
}

const GroupContext = createContext<GroupLogicReturn | undefined>(undefined);

export const useGroupContext = () => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("useGroupContext must be used within a GroupProvider");
  }
  return context;
};

export const GroupProvider: React.FC<GroupProviderProps> = ({
  children,
  groupId,
}) => {
  const groupLogic = useGroupLogic(groupId);

  return (
    <GroupContext.Provider value={groupLogic}>{children}</GroupContext.Provider>
  );
};

export { ActionTypes };
