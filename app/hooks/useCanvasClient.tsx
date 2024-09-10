// hooks/useCanvasClient.ts
import { useState, useEffect } from "react";
import { CanvasClient, CanvasInterface } from "@dscvr-one/canvas-client-sdk";
import { getCanvasClient } from "@/lib/canvasClientSingleton";

type CanvasState = {
  client: CanvasClient | undefined;
  user: CanvasInterface.Lifecycle.User | undefined;
  content: CanvasInterface.Lifecycle.Content | undefined;
  isReady: boolean;
};

export function useCanvasClient() {
  const [state, setState] = useState<CanvasState>({
    client: undefined,
    user: undefined,
    content: undefined,
    isReady: false,
  });

  useEffect(() => {
    async function initializeCanvas() {
      const client = getCanvasClient();

      try {
        const response = await client.ready();
        setState({
          client,
          user: response.untrusted.user,
          content: response.untrusted.content,
          isReady: true,
        });
      } catch (error) {
        console.error("Failed to initialize Canvas client:", error);
        setState((prev) => ({ ...prev, client, isReady: true }));
      }
    }

    initializeCanvas();
  }, []);

  return state;
}
