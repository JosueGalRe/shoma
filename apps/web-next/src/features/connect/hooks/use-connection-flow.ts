import { useCallback } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { RiftClient } from "../../../core/rift/rift-client";
import { RiftClientState, type RiftClientState as RiftClientStateValue } from "../../../core/rift/rift-client-types";
import { logEvent } from "../../../core/logging/app-logger";
import { RiftLcuTransport } from "../../../core/rift/rift-lcu-transport";
import type { ConnectionFormValues } from "../connect-types";

type UseConnectionFlowOptions = {
  code: string;
  client: RiftClient | null;
  lcuTransport: RiftLcuTransport;
  appendLog: (line: string) => void;
  setCode: (code: string) => void;
  setStatus: (status: RiftClientStateValue | null) => void;
  setClient: (client: RiftClient | null) => void;
  setErrorBanner: (message: string | null) => void;
  setValue: UseFormSetValue<ConnectionFormValues>;
  resetLcuSession: () => void;
  invalidCodeLengthMessage: string;
};

export function useConnectionFlow({
  code,
  client,
  lcuTransport,
  appendLog,
  setCode,
  setStatus,
  setClient,
  setErrorBanner,
  setValue,
  resetLcuSession,
  invalidCodeLengthMessage
}: UseConnectionFlowOptions) {
  const resetLcuState = useCallback(() => {
    lcuTransport.reset();
    resetLcuSession();
  }, [lcuTransport, resetLcuSession]);

  const handleConnect = useCallback(async (nextCode?: string) => {
    const targetCode = nextCode ?? code;
    if (targetCode.length !== 6) {
      setErrorBanner(invalidCodeLengthMessage);
      return;
    }

    setErrorBanner(null);

    if (client) {
      client.close();
    }

    window.localStorage.setItem("conduitID", targetCode);
    setCode(targetCode);
    setValue("code", targetCode);
    resetLcuState();
    logEvent("connection_start", { code: targetCode });

    const nextClient = new RiftClient({
      code: targetCode,
      onStateChange(nextState) {
        setStatus(nextState);
        logEvent("connection_state_change", { state: nextState });
      },
      onClose() {
        logEvent("connection_closed");
      },
      onData(payload) {
        appendLog(`receive: ${payload}`);
        lcuTransport.handlePayload(payload);
      }
    });

    setStatus(RiftClientState.CONNECTING);
    setClient(nextClient);
  }, [appendLog, client, code, invalidCodeLengthMessage, lcuTransport, resetLcuState, setClient, setCode, setErrorBanner, setStatus, setValue]);

  const handleCancel = useCallback(() => {
    if (client) {
      client.close();
    }

    setClient(null);
    setStatus(null);
    setErrorBanner(null);
    resetLcuState();
  }, [client, resetLcuState, setClient, setErrorBanner, setStatus]);

  const handleRetry = useCallback(() => {
    void handleConnect();
  }, [handleConnect]);

  const handleConnectSubmit = useCallback(async (values: ConnectionFormValues) => {
    await handleConnect(values.code);
  }, [handleConnect]);

  return {
    handleCancel,
    handleConnect,
    handleConnectSubmit,
    handleRetry
  };
}
