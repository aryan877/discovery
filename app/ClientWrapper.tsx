"use client";

import React, { useEffect } from "react";
import { useCanvasClient } from "./hooks/useCanvasClient";
import { registerCanvasWallet } from "@dscvr-one/canvas-wallet-adapter";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { isReady: isCanvasReady, client: canvasClient } = useCanvasClient();

  useEffect(() => {
    if (canvasClient) {
      registerCanvasWallet(canvasClient);
      console.log("Canvas wallet registered");
    }
  }, [canvasClient]);

  if (!isCanvasReady) {
    return <div>Loading Canvas...</div>;
  }

  return <div>{children}</div>;
}
