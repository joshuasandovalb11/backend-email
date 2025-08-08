// --- LISTA DE USUARIOS AUTORIZADOS ---
// Lista de números de teléfono que sí pueden usar la app.
const authorizedPhoneNumbers = [
  '6644114499',
  '6642282840',
  '6621900175',
  '6642229474',
  '6644044293',
  '6644114456',
  '6644114629',
  '6644046318',
  '6643854677',
  '6644044073',
  '6643084034',
  '6644114555',
  '6642252357',
  '6624254723',
  '6642223859',
  '6643979685',
  '6644049974',
  '6642225410',
  '6644084875',
  '6642251636',
  '6643866552'
];
// ------------------------------------

export default async function handler(req, res) {
  // Solo permitir peticiones de tipo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const { user_phone_number } = req.body;

  // Validar que el número fue enviado
  if (!user_phone_number) {
    return res.status(400).json({ success: false, error: 'Número de teléfono no proporcionado.' });
  }

  // Verificar si el número está en la lista blanca
  if (authorizedPhoneNumbers.includes(user_phone_number.trim())) {
    // Si el número es correcto, se concede el acceso.
    console.log(`Acceso concedido al número: ${user_phone_number}`);
    return res.status(200).json({ success: true, message: 'Usuario verificado con éxito.' });
  } else {
    // Si no está en la lista, se deniega el acceso.
    console.warn(`Intento de acceso denegado del número: ${user_phone_number}`);
    return res.status(403).json({ success: false, error: 'Acceso denegado. Este número no está autorizado.' });
  }
}