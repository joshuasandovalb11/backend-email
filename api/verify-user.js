// --- LISTA DE USUARIOS AUTORIZADOS CON NOMBRE Y TELÉFONO ---
// Ahora cada vendedor es un objeto con su nombre y número.
const authorizedUsers = [
  { name: "BARBOSA HIGUERA EDGAR", phone: "6644114499" },
  { name: "CABANILLAS GAXIOLA CARLOS", phone: "6621900175" },
  { name: "CERVANTES GONZALEZ LETICIA", phone: "6642282840" },
  { name: "DIAZ MILLAN MARCELINA", phone: "6642229474" },
  { name: "GARCIA REYES LAURA", phone: "6644044293" },
  { name: "GARCIA VEGA JULIAN", phone: "6644114456" },
  { name: "GONZALEZ LARA ANA LILIA", phone: "6644114629" },
  { name: "HERRERA LOPEZ CARLA", phone: "6644046318" },
  { name: "MARTINEZ MADERA GABRIELA", phone: "6643866552" },
  { name: "MEDINA JARAMILLO MARLIN", phone: "6643854677" },
  { name: "MEDRANO ELIZALDE JESUS", phone: "6644044073" },
  { name: "MONTES PINEDA MARIO ENRIQUE", phone: "6643084034" },
  { name: "OLIVAS BATRES RODRIGO", phone: "6644114555" },
  { name: "PENA GONZALEZ JESUS", phone: "6642252357" },
  { name: "PEREZ HERNANDEZ JOEL", phone: "6624254723" },
  { name: "RENTERIA RODRIGUEZ YOLANDA", phone: "6642223859" },
  { name: "REYES NEVARES ANA MARIA", phone: "6643979685" },
  { name: "RODRIGUEZ IBARRA ANTONIA", phone: "6644049974" },
  { name: "RODRIGUEZ PRECIADO VIRIDIANA", phone: "6642225410" },
  { name: "TAPIA LEDEZMA ANDRES", phone: "6644084875" },
  { name: "Prueba", phone: "6642251636" },
];
// ---------------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const { user_phone_number } = req.body;

  if (!user_phone_number) {
    return res
      .status(400)
      .json({ success: false, error: "Número de teléfono no proporcionado." });
  }

  // Buscamos al usuario por su número de teléfono
  const user = authorizedUsers.find(
    (u) => u.phone === user_phone_number.trim()
  );

  if (user) {
    console.log(`Acceso concedido a: ${user.name} (${user.phone})`);
    // Si lo encontramos, devolvemos el éxito y el nombre del vendedor
    return res.status(200).json({
      success: true,
      message: "Usuario verificado con éxito.",
      salesperson_name: user.name,
    });
  } else {
    console.warn(`Intento de acceso denegado del número: ${user_phone_number}`);
    return res.status(403).json({
      success: false,
      error: "Acceso denegado. Este número no está autorizado.",
    });
  }
}
