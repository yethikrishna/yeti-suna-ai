import React, { createContext, useContext, useReducer, useEffect } from 'react';

type DeleteState = {
  isDeleting: boolean;
  targetId: string | null;
  isActive: boolean;
  operation: 'none' | 'pending' | 'success' | 'error';
};

type DeleteAction = 
  | { type: 'START_DELETE'; id: string; isActive: boolean }
  | { type: 'DELETE_SUCCESS' }
  | { type: 'DELETE_ERROR' }
  | { type: 'RESET' };

const initialState: DeleteState = {
  isDeleting: false,
  targetId: null,
  isActive: false,
  operation: 'none'
};

function deleteReducer(state: DeleteState, action: DeleteAction): DeleteState {
  switch (action.type) {
    case 'START_DELETE':
      return {
        ...state,
        isDeleting: true,
        targetId: action.id,
        isActive: action.isActive,
        operation: 'pending'
      };
    case 'DELETE_SUCCESS':
      return {
        ...state,
        operation: 'success'
      };
    case 'DELETE_ERROR':
      return {
        ...state,
        isDeleting: false,
        operation: 'error'
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const DeleteOperationContext = createContext<{
  state: DeleteState;
  dispatch: React.Dispatch<DeleteAction>;
  performDelete: (id: string, isActive: boolean, deleteFunction: () => Promise<void>) => Promise<void>;
} | undefined>(undefined);

export function DeleteOperationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(deleteReducer, initialState);
  
  // Listen for state changes to handle navigation
  useEffect(() => {
    if (state.operation === 'success' && state.isActive) {
      // Delay navigation to allow UI feedback
      const timer = setTimeout(() => {
        window.location.pathname = '/dashboard';
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.operation, state.isActive]);
  
  // Auto-reset after operations complete
  useEffect(() => {
    if (state.operation === 'success' && !state.isActive) {
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.operation, state.isActive]);
  
  const performDelete = async (id: string, isActive: boolean, deleteFunction: () => Promise<void>) => {
    dispatch({ type: 'START_DELETE', id, isActive });
    
    try {
      await deleteFunction();
      dispatch({ type: 'DELETE_SUCCESS' });
    } catch (error) {
      console.error("Delete operation failed:", error);
      dispatch({ type: 'DELETE_ERROR' });
    }
  };
  
  return (
    <DeleteOperationContext.Provider value={{ state, dispatch, performDelete }}>
      {children}
    </DeleteOperationContext.Provider>
  );
}

export function useDeleteOperation() {
  const context = useContext(DeleteOperationContext);
  if (context === undefined) {
    throw new Error('useDeleteOperation must be used within a DeleteOperationProvider');
  }
  return context;
} 