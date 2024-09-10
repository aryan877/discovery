import { CanvasClient } from "@dscvr-one/canvas-client-sdk";
import { registerCanvasWallet } from "@dscvr-one/canvas-wallet-adapter";

let canvasClientInstance: CanvasClient | null = null;

export function getCanvasClient(): CanvasClient {
  if (!canvasClientInstance) {
    canvasClientInstance = new CanvasClient();
    registerCanvasWallet(canvasClientInstance);
    console.log("Canvas wallet registered");
  }
  return canvasClientInstance;
}
