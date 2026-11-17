// lib/proxy-auth.js
const DEFAULT_INTERNAL_API_URL = "http://toolsdemexico.net:3001/api";
const DEFAULT_APP_SECRET = "TME-Secret-2026";

export const getInternalApiUrl = () =>
    process.env.INTERNAL_API_URL || DEFAULT_INTERNAL_API_URL;

export const getAppSecret = () =>
    process.env.APP_SECRET || DEFAULT_APP_SECRET;

/**
 * Valida que el request incluya el secreto compartido de la aplicación.
 * Devuelve true si es válido; de lo contrario responde 403 y devuelve false.
 */
export const verifyAppSecret = (req, res) => {
    const appSecret = req.headers["x-app-secret"];
    if (appSecret !== getAppSecret()) {
        res.status(403).json({
            error: "Acceso denegado. Se requiere una API Key válida.",
        });
        return false;
    }
    return true;
};

/**
 * Valida el token Bearer contra `/accesos/validate-token` del servidor interno.
 * Distingue entre sesión inválida/revocada (401) y fallo de red/servidor (503).
 */
export const validateSessionToken = async (authHeader, timeoutMs = 8000) => {
    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        return {
            ok: false,
            status: 401,
            error: "No autorizado. Token faltante.",
        };
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token || token === "null" || token === "undefined") {
        return {
            ok: false,
            status: 401,
            error: "No autorizado. Token inválido.",
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${getInternalApiUrl()}/accesos/validate-token`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return {
                ok: false,
                status: response.status === 401 || response.status === 403 ? 401 : response.status,
                error: data.message || data.error || "Sesión revocada o inválida.",
            };
        }

        return { ok: true, status: 200, data };
    } catch (error) {
        console.error("Error validando token con API interna:", error);
        return {
            ok: false,
            status: 503,
            error: "No se pudo validar tu sesión en este momento. Intenta de nuevo.",
        };
    } finally {
        clearTimeout(timeoutId);
    }
};
