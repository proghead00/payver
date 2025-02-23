"use client";

import React, { createContext, useContext, useEffect, useReducer } from "react";
import { fetchGroups, fetchExpenses } from "@/services/groupService";

interface AppContextType {
  groups: any[];
  expenses: any[];
  isLoading: boolean;
  error: string | null;
  dispatch: React.Dispatch<any>;
}

const AppContext = createContext<AppContextType>({
  groups: [],
  expenses: [],
  isLoading: true,
  error: null,
  dispatch: () => {},
});

const appReducer = (state: any, action: any) => {
  switch (action.type) {
    case "SET_GROUPS":
      return { ...state, groups: action.payload };
    case "SET_EXPENSES":
      return { ...state, expenses: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, {
    groups: [],
    expenses: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        console.log("Starting data fetch...");

        // Fetch data separately to better handle errors
        const groupsData = await fetchGroups();
        console.log("Groups data fetched:", groupsData);
        dispatch({ type: "SET_GROUPS", payload: groupsData });

        const expensesData = await fetchExpenses();
        console.log("Expenses data fetched:", expensesData);
        dispatch({ type: "SET_EXPENSES", payload: expensesData });
      } catch (error) {
        console.error("Error in loadData:", error);
        dispatch({ type: "SET_ERROR", payload: "Failed to load data" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    loadData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        groups: state.groups,
        expenses: state.expenses,
        isLoading: state.isLoading,
        error: state.error,
        dispatch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
