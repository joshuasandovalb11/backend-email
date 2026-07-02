// test-api.js
// Este script sirve para enviar una petición de prueba a tu API local.

const testData = {
    client_number: "TEST-001",
    client_name: "Cliente de Prueba API",
    client_phone: "6641112233",
    latitude: 32.5149,
    longitude: -117.0382,
    salesperson_name: "Vendedor de Prueba",
    salesperson_phone: "6649998877"
};

async function runTest() {
    console.log("Iniciando prueba de API...");
    console.log("Datos a enviar:", testData);

    try {
        const response = await fetch("http://localhost:3000/api/send-mail", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        
        console.log("\n--- RESULTADO DE LA PRUEBA ---");
        console.log("Status Code:", response.status);
        console.log("Respuesta:", result);
        
        if (response.ok) {
            console.log("\n✅ ¡La prueba fue exitosa!");
        } else {
            console.log("\n❌ Hubo un error en la prueba.");
        }
    } catch (error) {
        console.error("\n❌ Error al conectar con la API local. ¿Seguro que el servidor está corriendo en el puerto 3000?", error);
    }
}

runTest();
