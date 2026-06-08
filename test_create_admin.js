async function run() {
  try {
    const payload = {
      NombreUsuario: 'admincreated',
      NombreCompleto: 'Admin Created',
      Correo: 'admincreated@gmail.com',
      Cedula: '9999999992',
      TipoDocumento: 'CC',
      IdRol: 2,
      NombreRol: 'Administrador',
      Contrasena: 'Temp-999999',
      Password: 'Temp-999999',
      Activo: true,
      Estado: 'activo'
    };
    const res = await fetch('http://kaivetapi.somee.com/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log("STATUS:", res.status);
    const data = await res.json();
    console.log("RESPONSE DATA:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
