"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertModalContextType {
  showAlert: (message: string, title?: string, type?: "info" | "success" | "error") => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const AlertModalContext = createContext<AlertModalContextType | undefined>(undefined);

export function useAlertModal() {
  const context = useContext(AlertModalContext);
  if (!context) {
    throw new Error("useAlertModal must be used within an AlertModalProvider");
  }
  return context;
}

type ModalState = {
  isOpen: boolean;
  type: "alert" | "confirm";
  message: string;
  title: string;
  alertType: "info" | "success" | "error";
  resolve?: (value: boolean | PromiseLike<boolean>) => void;
};

export function AlertModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: "alert",
    message: "",
    title: "",
    alertType: "info",
  });

  const showAlert = useCallback((message: string, title: string = "Notice", type: "info" | "success" | "error" = "info") => {
    return new Promise<void>((resolve) => {
      setModalState({
        isOpen: true,
        type: "alert",
        message,
        title,
        alertType: type,
        resolve: () => resolve(),
      });
    });
  }, []);

  const showConfirm = useCallback((message: string, title: string = "Confirm Action") => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        type: "confirm",
        message,
        title,
        alertType: "info",
        resolve,
      });
    });
  }, []);

  const handleClose = () => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AlertModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {modalState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={handleClose} />
          
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {modalState.type === "confirm" ? (
                  <AlertCircle className="h-6 w-6 text-honey-deep" />
                ) : modalState.alertType === "error" ? (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                ) : modalState.alertType === "success" ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Info className="h-6 w-6 text-blue-500" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-navy">{modalState.title}</h3>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{modalState.message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {modalState.type === "confirm" ? (
                <>
                  <Button variant="secondary" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleConfirm}>
                    Confirm
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={handleClose}>
                  OK
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </AlertModalContext.Provider>
  );
}
