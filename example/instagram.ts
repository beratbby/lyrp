import { URLSearchParams } from "url";
import { igQueue } from "./ig-queue";

function getEnv(name: string, fallback?: string): string | undefined {
    const val = process.env[name];
    return val !== undefined ? val : fallback;
}

function extractCookieValue(cookie: string, key: string): string | undefined {
    const match = cookie.match(new RegExp(`${key}=([^;]+)`));
    return match ? match[1] : undefined;
}

function normalizeHandle(handle: string): string {
    return handle.replace(/^@+/, "").trim().toLowerCase();
}

export async function verifyUserFollowsTarget(instagramHandle: string, viewerCookieOverride?: string): Promise<{ ok: boolean; reason?: string; isPrivate?: boolean }> {
    const cookie = viewerCookieOverride || getEnv("INSTAGRAM_COOKIE");
    const igAppId = getEnv("INSTAGRAM_IG_APP_ID", "936619743392459");
    const igWwwClaim = getEnv("INSTAGRAM_IG_WWW_CLAIM", "0");
    const webSessionId = getEnv("INSTAGRAM_WEB_SESSION_ID");
    const webDeviceId = getEnv("INSTAGRAM_WEB_DEVICE_ID");

    if (!cookie) {
        return { ok: false, reason: "INSTAGRAM_COOKIE not configured" };
    }

    const csrf = extractCookieValue(cookie, "csrftoken");

    const expected = instagramHandle.trim();
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(expected)}`;

    const headers: Record<string, string> = {
        accept: "*/*",
        "accept-language": "de-DE,de;q=0.9",
        cookie,
        priority: "u=1, i",
        referer: `https://www.instagram.com/${expected}/`,
        "sec-ch-prefers-color-scheme": "dark",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.60 Safari/537.36",
        "x-asbd-id": "359341",
        "x-ig-app-id": igAppId!,
        "x-requested-with": "XMLHttpRequest",
    };

    if (csrf) headers["x-csrftoken"] = csrf;
    if (igWwwClaim) headers["x-ig-www-claim"] = igWwwClaim;
    if (webSessionId) headers["x-web-session-id"] = webSessionId;
    if (webDeviceId) headers["x-web-device-id"] = webDeviceId;

    try {
        const resp = await igQueue.enqueue(() => fetch(url, { method: "GET", headers }));
        if (!resp.ok) {
            return { ok: false, reason: `Instagram responded ${resp.status}` };
        }
        const data = await resp.json();

        const user = (data as any)?.data?.user;
        if (!user) {
            const message = (data as any)?.message || "No user in response";
            return { ok: false, reason: message };
        }

        const username = String(user.username || "");
        if (username !== expected) {
            return { ok: false, reason: "Exact username mismatch" };
        }

        const followsViewer = Boolean(user.follows_viewer === true);
        const isPrivate = Boolean(user.is_private === true);

        if (followsViewer) {
            return { ok: true, isPrivate };
        }
        return { ok: false, reason: "User does not follow viewer", isPrivate };
    } catch (err: any) {
        return { ok: false, reason: `Fetch error: ${err?.message || String(err)}` };
    }
}

export async function getUserProfile(instagramHandle: string): Promise<{ ok: boolean; reason?: string; biography?: string; isPrivate?: boolean }> {
    const cookie = getEnv("INSTAGRAM_COOKIE");
    const igAppId = getEnv("INSTAGRAM_IG_APP_ID", "936619743392459");
    const igWwwClaim = getEnv("INSTAGRAM_IG_WWW_CLAIM", "0");
    const webSessionId = getEnv("INSTAGRAM_WEB_SESSION_ID");
    const webDeviceId = getEnv("INSTAGRAM_WEB_DEVICE_ID");

    if (!cookie) {
        return { ok: false, reason: "INSTAGRAM_COOKIE not configured" };
    }

    const csrf = extractCookieValue(cookie, "csrftoken");
    const expected = instagramHandle.trim();
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(expected)}`;

    const headers: Record<string, string> = {
        accept: "*/*",
        "accept-language": "de-DE,de;q=0.9",
        cookie,
        priority: "u=1, i",
        referer: `https://www.instagram.com/${expected}/`,
        "sec-ch-prefers-color-scheme": "dark",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.60 Safari/537.36",
        "x-asbd-id": "359341",
        "x-ig-app-id": igAppId!,
        "x-requested-with": "XMLHttpRequest",
    };
    if (csrf) headers["x-csrftoken"] = csrf;
    if (igWwwClaim) headers["x-ig-www-claim"] = igWwwClaim;
    if (webSessionId) headers["x-web-session-id"] = webSessionId;
    if (webDeviceId) headers["x-web-device-id"] = webDeviceId;

    try {
        const resp = await igQueue.enqueue(() => fetch(url, { method: "GET", headers }));
        if (!resp.ok) {
            return { ok: false, reason: `Instagram responded ${resp.status}` };
        }
        const data = await resp.json();
        const user = (data as any)?.data?.user;
        if (!user) {
            const message = (data as any)?.message || "No user in response";
            return { ok: false, reason: message };
        }
        const biography = String(user.biography || "");
        const isPrivate = Boolean(user.is_private === true);
        return { ok: true, biography, isPrivate };
    } catch (err: any) {
        return { ok: false, reason: `Fetch error: ${err?.message || String(err)}` };
    }
}

export async function checkInstagramCookieHealth(): Promise<{ healthy: boolean; status?: number; reason?: string }> {
    const cookie = getEnv("INSTAGRAM_COOKIE");
    const igAppId = getEnv("INSTAGRAM_IG_APP_ID", "936619743392459");
    const igWwwClaim = getEnv("INSTAGRAM_IG_WWW_CLAIM", "0");
    const webSessionId = getEnv("INSTAGRAM_WEB_SESSION_ID");
    const webDeviceId = getEnv("INSTAGRAM_WEB_DEVICE_ID");

    if (!cookie) {
        return { healthy: false, reason: "INSTAGRAM_COOKIE not configured" };
    }

    const csrf = extractCookieValue(cookie, "csrftoken");
    const url = `https://www.instagram.com/api/v1/feed/reels_tray/`;
    const headers: Record<string, string> = {
        accept: "*/*",
        "accept-language": "de-DE,de;q=0.9",
        cookie,
        priority: "u=1, i",
        referer: `https://www.instagram.com/`,
        "sec-ch-prefers-color-scheme": "dark",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.60 Safari/537.36",
        "x-asbd-id": "359341",
        "x-ig-app-id": igAppId!,
        "x-requested-with": "XMLHttpRequest",
    };
    if (csrf) headers["x-csrftoken"] = csrf;
    if (igWwwClaim) headers["x-ig-www-claim"] = igWwwClaim;
    if (webSessionId) headers["x-web-session-id"] = webSessionId;
    if (webDeviceId) headers["x-web-device-id"] = webDeviceId;

    try {
        const resp = await igQueue.enqueue(() => fetch(url, { method: "GET", headers }));
        const status = resp.status;
        if (!resp.ok) {
            let reason = `Instagram responded ${status}`;
            try {
                const text = await resp.text();
                if (/login_required|invalid_session|not_authenticated/i.test(text)) {
                    reason = "login_required";
                }
            } catch { }
            return { healthy: false, status, reason };
        }
        try {
            const data = await resp.json();
            const msg = (data as any)?.message;
            if (typeof msg === 'string' && /login_required|invalid_session|not_authenticated/i.test(msg)) {
                return { healthy: false, status, reason: msg };
            }
        } catch { }
        return { healthy: true, status };
    } catch (err: any) {
        return { healthy: false, reason: `Fetch error: ${err?.message || String(err)}` };
    }
}
