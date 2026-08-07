export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido. Usa POST." });
    }

    try {
        const appSecret = req.headers["x-app-secret"];
        if (appSecret !== "TME-Secret-2026") {
            return res.status(403).json({ error: "Acceso denegado. Se requiere una API Key válida." });
        }
        const { telefono, id_app } = req.body;

        if (!telefono || !id_app) {
            return res.status(400).json({ error: "Faltan parámetros requeridos: telefono, id_app." });
        }

        // Utilizamos la variable de entorno o caemos al valor por defecto proporcionado
        const internalApiUrl = process.env.INTERNAL_API_URL || "http://toolsdemexico.net:3001/api";
        const targetUrl = `${internalApiUrl}/accesos/request-sms`;

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ telefono, id_app })
        });

        // Intentamos parsear la respuesta JSON del servidor interno
        const data = await response.json().catch(() => ({ error: "Respuesta no válida del servidor interno." }));

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error("Error en request-sms proxy:", error);
        return res.status(500).json({ error: "Error interno del servidor (Proxy Vercel)." });
    }
}
