// api/send-mail.js
import nodemailer from "nodemailer";

// Destinatarios leídos desde Variables de Entorno (o lista oficial de la empresa)
const parseRecipients = (envVar, defaultList) => {
    const raw = process.env[envVar];
    if (raw && raw.trim().length > 0) {
        return raw.split(",").map((email) => email.trim()).filter(Boolean);
    }
    return defaultList;
};

const CLIENT_RECIPIENTS = parseRecipients("CLIENT_RECIPIENTS", [
    "credito@toolsdemexico.com.mx",
    "marcos@toolsdemexico.com.mx",
    "logistica@toolsdemexico.com.mx",
]);

const LOCATION_RECIPIENTS = parseRecipients("LOCATION_RECIPIENTS", [
    "marcos@toolsdemexico.com.mx",
]);

const senderName = "Tools de México";

const formatPhoneNumber = (phone) => {
    const cleaned = ("" + phone).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido. Usa POST." });
    }

    try {
        const {
            type, // "CLIENT" | "LOCATION"
            client_number,
            client_name,
            client_phone,
            place_category,
            photo_base64,
            latitude,
            longitude,
            salesperson_name,
            salesperson_phone,
        } = req.body;

        const isLocation = type === "LOCATION";

        // Configuración de modo prueba leída 100% de Variables de Entorno en Vercel
        const enableTestMode = process.env.ENABLE_TEST_MODE === "true";
        const testEmail = process.env.TEST_EMAIL ? process.env.TEST_EMAIL.trim() : null;
        const testPhones = process.env.TEST_PHONES
            ? process.env.TEST_PHONES.split(",").map((p) => p.replace(/\D/g, "").trim()).filter(Boolean)
            : [];

        const cleanSalesPhone = (salesperson_phone || "").replace(/\D/g, "");
        const cleanSalesName = (salesperson_name || "").toUpperCase().trim();
        const cleanClientName = (client_name || "").toUpperCase().trim();

        // Es prueba solo si ENABLE_TEST_MODE="true" Y se configuró TEST_EMAIL en Vercel,
        // Y el teléfono está en TEST_PHONES o el nombre contiene "PRUEBA"
        const isTestSubmission =
            enableTestMode &&
            Boolean(testEmail) &&
            (testPhones.includes(cleanSalesPhone) ||
                cleanSalesName.includes("PRUEBA") ||
                cleanClientName.includes("PRUEBA"));

        // Validación según tipo de registro
        if (!salesperson_name || !salesperson_phone) {
            return res.status(400).json({ error: "Faltan los datos del vendedor." });
        }

        if (isLocation) {
            if (!latitude || !longitude) {
                return res.status(400).json({ error: "Las coordenadas GPS son requeridas para registrar una ubicación." });
            }
        } else {
            // Validación para CLIENT
            if (!client_number || !client_name) {
                return res.status(400).json({ error: "Faltan datos del cliente (# y nombre)." });
            }
            if (!client_phone && (!latitude || !longitude)) {
                return res.status(400).json({ error: "Debes proveer al menos el teléfono o la ubicación del cliente." });
            }
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.office365.com",
            port: 587,
            secure: false,
            connectionTimeout: 25000,
            greetingTimeout: 20000,
            socketTimeout: 30000,
            auth: {
                user: process.env.GODADDY_EMAIL_USER,
                pass: process.env.GODADDY_EMAIL_PASSWORD,
            },
        });

        const mapLink = `http://maps.google.com/maps?q=${latitude},${longitude}`;
        const currentTime = new Date().toLocaleString("es-MX", {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "America/Tijuana",
        });

        const formattedSalesPhone = formatPhoneNumber(salesperson_phone);
        const finalPlaceName = place_category || "Establecimiento";

        const attachments = [];
        let photoHtmlSection = "";

        if (photo_base64) {
            const cleanBase64 = photo_base64.includes(";base64,")
                ? photo_base64.split(";base64,").pop()
                : photo_base64;

            const safeFilename = `fachada_${finalPlaceName.toLowerCase().replace(/[^a-z0-9]/g, "_")}.jpg`;

            attachments.push({
                filename: safeFilename,
                content: Buffer.from(cleanBase64, "base64"),
                cid: "store_facade_photo",
            });

            photoHtmlSection = `
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; text-align: center; margin: 20px;">
                <div style="margin-bottom: 12px; text-align: center;">
                    <div style="width: 44px; height: 44px; line-height: 44px; background-color: #f59e0b; border-radius: 50%; margin: 0 auto; text-align: center;">
                        <span style="font-size: 22px; vertical-align: middle;">📷</span>
                    </div>
                </div>
                <h3 style="color: #2d3748; margin: 0 0 6px 0; font-size: 17px; font-weight: 600;">
                    Fotografía de la Fachada
                </h3>
                <p style="color: #718096; margin: 0 0 16px 0; font-size: 13px;">
                    Captura del establecimiento tomada en el lugar
                </p>
                <div style="border-radius: 10px; overflow: hidden; border: 1px solid #cbd5e1; max-width: 520px; margin: 0 auto; background-color: #000;">
                    <img src="cid:store_facade_photo" alt="Fachada de ${finalPlaceName}" style="width: 100%; max-height: 480px; object-fit: contain; display: block;" />
                </div>
            </div>`;
        }

        const finalCoordsHTML = (latitude && longitude)
            ? `<strong>${latitude}, ${longitude}</strong>`
            : `<span>No proporcionada</span>`;

        const googleMapsSection = (latitude && longitude) ? `
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 20px;">
                    <div style="margin-bottom: 20px; text-align: center;">
                        <div style="width: 48px; height: 48px; line-height: 48px; background-color: #4299e1; border-radius: 50%; margin: 0 auto; text-align: center;">
                            <span style="font-size: 25px; vertical-align: middle;">🌍</span>
                        </div>
                    </div>
                    
                    <h3 style="color: #2d3748; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                        Ubicación Geográfica
                    </h3>
                    <p style="color: #718096; margin: 0 0 24px 0; font-size: 14px;">
                        Visualizar la ubicación exacta en el mapa
                    </p>
                    
                    <a href="${mapLink}" 
                    style="display: inline-block; background-color: #4299e1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: 0.3px; transition: all 0.2s ease; border: none; text-transform: uppercase;">
                        Ver en Google Maps
                    </a>
                </div>` : '';

        // Contenido según si es LOCATION o CLIENT
        const mainCardSection = isLocation ? `
            <div style="background-color: #fef2f2; border-radius: 12px; border: 1px solid #fecaca; overflow: hidden; margin: 20px 20px 0;">
                <div style="background-color: #fee2e2; padding: 10px 24px; border-bottom: 1px solid #fecaca;">
                    <h3 style="margin: 0; color: #991b1b; font-size: 18px; font-weight: 600; letter-spacing: -0.3px;">
                        Detalles de la Ubicación
                    </h3>
                </div>
                
                <div style="padding: 5px 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0; width: 140px;">
                                <div style="color: #718096; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Lugar / Tienda
                                </div>
                            </td>
                            <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
                                <div style="color: #1a202c; font-size: 17px; font-weight: 700;">
                                    ${finalPlaceName}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 16px 0;">
                                <div style="color: #718096; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Coordenadas
                                </div>
                            </td>
                            <td style="padding: 16px 0;">
                                <div style="background-color: #ffffff; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0; display: inline-block;">
                                    <div style="color: #4a5568; font-size: 15px; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace; line-height: 1.5;">
                                        ${finalCoordsHTML}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        ` : `
            <div style="background-color: #f0fdf4; border-radius: 12px; border: 1px solid #a7f3d0; overflow: hidden; margin: 20px 20px 0;">
                <div style="background-color: #d1fae5; padding: 8px 24px; border-bottom: 1px solid #a7f3d0;">
                    <h3 style="margin: 0; color: #065f46; font-size: 18px; font-weight: 600; letter-spacing: -0.3px;">
                        Información del Cliente
                    </h3>
                </div>
                
                <div style="padding: 5px 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0; width: 140px;">
                                <div style="color: #718096; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                    # Cliente
                                </div>
                            </td>
                            <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0; width: 140px;">
                                <div style="color: #1a202c; font-size: 16px; font-weight: 600; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;">
                                    ${client_number}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
                                <div style="color: #718096; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Nombre
                                </div>
                            </td>
                            <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
                                <div style="color: #1a202c; font-size: 16px; font-weight: 600; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;">
                                    ${client_name}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
                                <div style="color: #718096; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Teléfono
                                </div>
                            </td>
                            <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
                                <div style="color: #1a202c; font-size: 16px; font-weight: 600; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;">
                                    ${client_phone || "No proporcionado"}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 16px 0;">
                                <div style="color: #718096; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Coordenadas
                                </div>
                            </td>
                            <td style="padding: 16px 0;">
                                <div style="background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                    <div style="color: #4a5568; font-size: 16px; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace; line-height: 1.5;">
                                        ${finalCoordsHTML}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        `;

        const headerTitle = isLocation ? `Ubicación: ${finalPlaceName}` : "Registro de Cliente";
        const headerSubtitle = isLocation ? "Registro de ubicación de establecimiento" : "Sistema de Clientes";

        const emailHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${headerTitle}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background-color: #f7f8fc; line-height: 1.6; color: #2d3748;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 8px 25px rgba(0,0,0,0.08); border-radius: 16px; overflow: hidden;">
                
                <div style="background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%); padding: 22px 30px; position: relative;">
                    <div style="text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                            ${headerTitle}
                        </h1>
                        <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">
                            ${headerSubtitle}
                        </p>
                    </div>
                </div>
                
                ${mainCardSection}

                <div style="background-color: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin: 20px;">
                    <div style="background-color: #dde9f5ff; padding: 5px 24px; border-bottom: 1px solid #e2e8f0;">
                        <h3 style="margin: 0; color: #2d3748; font-size: 18px; font-weight: 600; letter-spacing: -0.3px;">
                            Registrado Por
                        </h3>
                    </div>
                    <div style="padding: 5px 24px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb; width: 140px;">
                                    <div style="color: #374151; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                        Vendedor
                                    </div>
                                </td>
                                <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                                    <div style="color: #1a202c; font-size: 16px; font-weight: 600; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;">
                                        ${salesperson_name}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 16px 0;">
                                    <div style="color: #374151; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                        Teléfono
                                    </div>
                                </td>
                                <td style="padding: 16px 0;">
                                    <div style="color: #1a202c; font-size: 16px; font-weight: 600; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;">
                                        ${formattedSalesPhone}
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                ${googleMapsSection}

                ${photoHtmlSection}
            </div>

            <div style="background-color: #f7fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0;">
                <div style="text-align: center;">
                    <p style="color: #a0aec0; margin: 0; font-size: 13px; font-weight: 500;">
                        Registro GPS — Tools de México
                    </p>
                    <p style="color: #cbd5e0; margin: 4px 0 0 0; font-size: 12px;">
                        Notificación automática generada el ${currentTime}
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

        // Selección de destinatarios
        const recipientList = isTestSubmission
            ? [testEmail]
            : (isLocation ? LOCATION_RECIPIENTS : CLIENT_RECIPIENTS);

        const baseSubject = isLocation
            ? `Ubicación Registrada: ${finalPlaceName} — ${salesperson_name}`
            : `Nuevo Cliente Registrado: #${client_number} - ${client_name}`;

        const emailSubject = isTestSubmission ? `[PRUEBA] ${baseSubject}` : baseSubject;

        const emailPromise = transporter.sendMail({
            from: `"${senderName}" <${process.env.GODADDY_EMAIL_USER}>`,
            to: recipientList.join(", "),
            subject: emailSubject,
            html: emailHtml,
            attachments: attachments.length > 0 ? attachments : undefined,
        });

        let webhookPromise;
        // Solo enviar a Google Sheets si:
        // 1. Hay URL de webhook configurada
        // 2. NO es un envío de prueba (isTestSubmission === false)
        // 3. NO es una ubicación de tienda/Berel (!isLocation, las tiendas van a SQL Server, no a Sheets)
        if (process.env.GOOGLE_WEBHOOK_URL && !isTestSubmission && !isLocation) {
            webhookPromise = fetch(process.env.GOOGLE_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req.body),
            });
        } else {
            webhookPromise = Promise.resolve({ skipped: true });
        }

        let dbPromise = Promise.resolve({ skipped: true });
        if (isLocation) {
            const internalApiUrl = process.env.INTERNAL_API_URL || "http://toolsdemexico.net:3001/api";
            const targetUrl = `${internalApiUrl}/ubicaciones`;

            const dbPayload = {
                categoria: (place_category || "PINTURAS_BEREL").toUpperCase().replace(/\s+/g, "_"),
                marca: place_category || "Pinturas Berel",
                nombre_establecimiento: place_category || "Pinturas Berel",
                latitud: Number(latitude),
                longitud: Number(longitude),
                nombre_vendedor: salesperson_name,
                telefono_vendedor: salesperson_phone,
                fecha_captura: new Date().toISOString(),
            };

            const dbHeaders = {
                "Content-Type": "application/json",
            };
            if (req.headers["authorization"]) {
                dbHeaders["Authorization"] = req.headers["authorization"];
            }
            if (req.headers["x-app-secret"]) {
                dbHeaders["x-app-secret"] = req.headers["x-app-secret"];
            }

            dbPromise = fetch(targetUrl, {
                method: "POST",
                headers: dbHeaders,
                body: JSON.stringify(dbPayload),
            }).then(async (response) => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.message || data.error || `HTTP ${response.status}`);
                }
                return data;
            });
        }

        const [emailResult, webhookResult, dbResult] = await Promise.allSettled([
            emailPromise,
            webhookPromise,
            dbPromise,
        ]);

        let emailSuccess = emailResult.status === "fulfilled";
        let webhookSuccess = false;
        let dbSuccess = false;
        let idUbicacion = null;

        if (isLocation) {
            if (dbResult.status === "fulfilled" && !dbResult.value?.skipped) {
                dbSuccess = true;
                idUbicacion = dbResult.value?.id_ubicacion || null;
            } else if (dbResult.status === "rejected") {
                console.error("Error al registrar ubicación en BD SistemaRutasDB:", dbResult.reason);
            }
        }

        if (webhookResult.status === "fulfilled") {
            if (webhookResult.value?.skipped || !process.env.GOOGLE_WEBHOOK_URL) {
                webhookSuccess = true;
            } else if (webhookResult.value && webhookResult.value.ok) {
                webhookSuccess = true;
            }
        }

        if (!emailSuccess) {
            console.error("Error al enviar el correo:", emailResult.reason);
        }
        if (webhookResult.status === "rejected") {
            console.error("Error de red/conexión al webhook:", webhookResult.reason);
        } else if (process.env.GOOGLE_WEBHOOK_URL && !webhookResult.value?.skipped && webhookResult.value && !webhookResult.value.ok) {
            console.error("Error del webhook (HTTP status):", webhookResult.value.status, webhookResult.value.statusText);
        }

        if (!emailSuccess && !webhookSuccess && process.env.GOOGLE_WEBHOOK_URL) {
            return res.status(500).json({
                error: "Fallo completo: no se pudo enviar correo ni guardar en Sheets.",
                emailError: emailResult.reason?.message,
                webhookError: webhookResult.reason?.message,
                dbError: dbResult.reason?.message,
            });
        }

        res.status(200).json({
            message: "Petición procesada.",
            email_sent: emailSuccess,
            db_saved: isLocation ? dbSuccess : undefined,
            id_ubicacion: idUbicacion,
            webhook_sent: webhookSuccess,
            recipients_count: recipientList.length,
            is_testing: isTestSubmission,
        });
    } catch (error) {
        console.error("Error general en el manejador:", error);
        res.status(500).json({
            error: "Error interno del servidor.",
            details: error.message,
        });
    }
}
