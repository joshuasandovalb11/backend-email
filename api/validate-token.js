// api/validate-token.js
import { validateSessionToken, verifyAppSecret } from "../lib/proxy-auth.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido. Usa POST." });
    }

    if (!verifyAppSecret(req, res)) {
        return;
    }

    const result = await validateSessionToken(req.headers.authorization);
    if (!result.ok) {
        return res.status(result.status).json({
            success: false,
            error: result.error,
        });
    }

    return res.status(200).json({
        success: true,
        message: result.data?.message || "Sesión válida.",
    });
}
