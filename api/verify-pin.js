export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido. Usa POST." });
    }

    try {
        const appSecret = req.headers["x-app-secret"];
        if (appSecret !== "TME-Secret-2026") {
            return res.status(403).json({ error: "Acceso denegado. Se requiere una API Key válida." });
        }
        const { telefono, id_app, pin, device_uuid, device_model } = req.body;

        if (!telefono || !id_app || !pin || !device_uuid) {
            return res.status(400).json({ error: "Faltan parámetros requeridos." });
        }

        const internalApiUrl = process.env.INTERNAL_API_URL || "http://toolsdemexico.net:3001/api";
        const targetUrl = `${internalApiUrl}/accesos/verify-pin`;

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ telefono, id_app, pin, device_uuid, device_model })
        });

        const data = await response.json().catch(() => ({ error: "Respuesta no válida del servidor interno." }));

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error("Error en verify-pin proxy:", error);
        return res.status(500).json({ error: "Error interno del servidor (Proxy Vercel)." });
    }
}
