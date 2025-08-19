import nodemailer from "nodemailer";

// --- CONFIGURACIÓN PRINCIPAL ---
// Lista de correos fijos que recibirán la notificación.
const recipientEmails = [
  "credito@toolsdemexico.com.mx",
  "marcos@toolsdemexico.com.mx",
];
// Nombre que aparecerá como remitente.
const senderName = "Tools de México";
// ------------------------------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  try {
    const { client_number, client_name, latitude, longitude } = req.body;

    if (!client_number || !client_name || !latitude || !longitude) {
      return res.status(400).json({ error: "Faltan datos en la petición." });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com", // Servidor SMTP de GoDaddy
      port: 465,
      secure: true,
      auth: {
        user: process.env.GODADDY_EMAIL_USER, // Correo de GoDaddy (leído desde las variables de entorno)
        pass: process.env.GODADDY_EMAIL_PASSWORD, // Contraseña (leída desde las variables de entorno)
      },
    });

    const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const currentTime = new Date().toLocaleString("es-MX", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "America/Tijuana",
    });

    const emailHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registro de Nuevo Cliente</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background-color: #f7f8fc; line-height: 1.6; color: #2d3748;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 8px 25px rgba(0,0,0,0.08); border-radius: 16px; overflow: hidden;">
                
        <!-- Header -->
        <div style="background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%); padding: 20px 30px; position: relative;">
            <div style="text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    Registro de Cliente
                </h1>
            </div>
        </div>
                
                <!-- Client Information -->
                <div style="background-color: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 15px; margin-top: 10px">
                    <div style="background-color: #edf2f7; padding: 5px 24px; border-bottom: 1px solid #e2e8f0;">
                        <h3 style="margin: 0; color: #2d3748; font-size: 18px; font-weight: 600; letter-spacing: -0.3px;">
                            Información del Cliente
                        </h3>
                    </div>
                    
                    <div style="padding: 5px 24px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0; width: 140px;">
                                    <div style="color: #718096; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                        ID Cliente
                                    </div>
                                </td>
                                <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;">
                                    <div style="color: #1a202c; font-size: 16px; font-weight: 600; ">
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
                                <td style="padding: 16px 0;">
                                    <div style="color: #718096; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                        Coordenadas
                                    </div>
                                </td>
                                <td style="padding: 16px 0;">
                                    <div style="background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                        <div style="color: #4a5568; font-size: 16px; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace; line-height: 1.5;">
                                            <strong>${latitude},${longitude}</strong>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Map Section -->
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center;">
                    <div style="margin-bottom: 20px; text-align: center;">
                        <div style="width: 48px; height: 48px; line-height: 48px; background-color: #4299e1; border-radius: 50%; margin: 0 auto; text-align: center;">
                            <span style="font-size: 25px; vertical-align: middle;">🌍</span>
                        </div>
                    </div>
                    
                    <h3 style="color: #2d3748; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                        Ubicación Geográfica
                    </h3>
                    <p style="color: #718096; margin: 0 0 24px 0; font-size: 14px;">
                        Visualizar la ubicación exacta del cliente en el mapa
                    </p>
                    
                    <a href="${mapLink}" 
                    style="display: inline-block; background-color: #4299e1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: 0.3px; transition: all 0.2s ease; border: none; text-transform: uppercase;">
                        Ver en Google Maps
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0;">
                <div style="text-align: center;">
                    <p style="color: #a0aec0; margin: 0; font-size: 13px; font-weight: 500;">
                        Sistema de Gestión de Clientes
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

    await transporter.sendMail({
      from: `"${senderName}" <${process.env.GODADDY_EMAIL_USER}>`,
      to: recipientEmails.join(", "),
      subject: `Nuevo Cliente Registrado: #${client_number} - ${client_name}`,
      html: emailHtml,
    });

    res.status(200).json({ message: "Correo enviado con éxito." });
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    res.status(500).json({
      error: "Error interno del servidor al enviar el correo.",
      details: error.message,
    });
  }
}
