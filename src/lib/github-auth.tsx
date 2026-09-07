"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Connects a contributor's GitHub account with the OAuth device flow.
 *
 * The token lives in sessionStorage (cleared when the tab closes) and is sent
 * per request to the content API, which uses it and forgets it. Nothing about
 * the contributor's GitHub account is stored on the server.
 */

const KEY = "usapho-github-token";

export interface DeviceStep {
  userCode: string;
  verificationUri: string;
}

export function useGitHub() {
  const [token, setToken] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [ready, setReady] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (!saved) {
      setReady(true);
      return;
    }
    setToken(saved);
    fetch("/api/content?resource=me", { headers: { "x-github-token": saved } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setLogin(d.login))
      .catch(() => {
        sessionStorage.removeItem(KEY);
        setToken(null);
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => () => {
    cancelled.current = true;
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      const res = await fetch("/api/github/device", { method: "POST" });
      const start = await res.json();
      if (!res.ok) throw new Error(start.error ?? "Could not reach GitHub.");
      setDevice({ userCode: start.userCode, verificationUri: start.verificationUri });

      const deadline = Date.now() + start.expiresIn * 1000;
      let wait = start.interval * 1000;

      while (Date.now() < deadline && !cancelled.current) {
        await new Promise((r) => setTimeout(r, wait));
        const pollRes = await fetch("/api/github/device", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceCode: start.deviceCode }),
        });
        const poll = await pollRes.json();

        if (poll.status === "slow_down") {
          wait += 5000;
          continue;
        }
        if (poll.status === "authorization_pending") continue;
        if (poll.error) throw new Error(poll.error);

        if (poll.token) {
          sessionStorage.setItem(KEY, poll.token);
          setToken(poll.token);
          const me = await fetch("/api/content?resource=me", {
            headers: { "x-github-token": poll.token },
          }).then((r) => r.json());
          setLogin(me.login);
          setDevice(null);
          return;
        }
      }
      throw new Error("The code expired before it was approved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to GitHub.");
      setDevice(null);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setToken(null);
    setLogin(null);
  }, []);

  /** fetch wrapper that attaches the contributor's token */
  const api = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const res = await fetch(input, {
        ...init,
        headers: {
          ...init.headers,
          ...(token ? { "x-github-token": token } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      return data;
    },
    [token]
  );

  return {
    ready,
    token,
    login,
    device,
    error,
    connecting,
    connect,
    disconnect,
    api,
    connected: Boolean(token && login),
  };
}
