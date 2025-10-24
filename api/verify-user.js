// --- LISTA DE USUARIOS AUTORIZADOS ---
// Se convierte en una lista de objetos para asociar un nombre a cada número.
const authorizedUsers = [
  { phone: "6644114499", name: "BARBOSA HIGUERA EDGAR" },
  { phone: "6621900175", name: "CABANILLAS GAXIOLA CARLOS" },
  { phone: "6642282840", name: "CERVANTES GONZALEZ LETICIA" },
  { phone: "6642229474", name: "DIAZ MILLAN MARCELINA" },
  { phone: "6644049974", name: "FLORES VELAZQUEZ DENISSE" },
  { phone: "6644044293", name: "GARCIA REYES LAURA" },
  { phone: "6644114456", name: "GARCIA VEGA JULIAN" },
  { phone: "6644114629", name: "GONZALEZ LARA ANA LILIA" },
  { phone: "6644046318", name: "HERRERA LOPEZ CARLA" },
  { phone: "6862448150", name: "MARTINEZ MADERA GABRIELA" },
  { phone: "6643854677", name: "MEDINA JARAMILLO MARLIN" },
  { phone: "6644044073", name: "MEDRANO ELIZALDE JESUS" },
  { phone: "6643084034", name: "MONTES PINEDA MARIO ENRIQUE" },
  { phone: "6644114555", name: "OLIVAS BATRES RODRIGO" },
  { phone: "6642252357", name: "PENA GONZALES JESUS" },
  { phone: "6624254723", name: "PEREZ HERNANDEZ JOEL" },
  { phone: "6642223859", name: "RENTERIA RODRIGUEZ YOLANDA" },
  { phone: "6643979685", name: "REYES NEVARES ANA MARIA" },
  { phone: "6632032986", name: "RODRIGUEZ IBARRA ANTONIA" },
  { phone: "6642225410", name: "RODRIGUEZ PRECIADO VIRIDIANA" },
  { phone: "6644084875", name: "TAPIA LEDEZMA ANDRES" },
  { phone: "6622974290", name: "Blanca Ramirez" },
  { phone: "6648171212", name: "PRUEBA" },
  { phone: "6121774238", name: "Rafael" },
];
// ------------------------------------

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

  // Se busca el objeto de usuario completo
  const user = authorizedUsers.find(
    (u) => u.phone === user_phone_number.trim()
  );

  if (user) {
    console.log(`Acceso concedido al número: ${user_phone_number}`);
    // CAMBIO: Se devuelve el objeto de usuario (nombre y teléfono) a la app.
    return res.status(200).json({
      success: true,
      message: "Usuario verificado con éxito.",
      user: { name: user.name, phone: user.phone },
    });
  } else {
    console.warn(`Intento de acceso denegado del número: ${user_phone_number}`);
    return res.status(403).json({
      success: false,
      error: "Acceso denegado. Este número no está autorizado.",
    });
  }
}
