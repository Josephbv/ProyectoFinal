import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api/clientes';

async function testClientDeletion() {
    console.log('--- TESTING CLIENT DELETION CASSCADE ---');
    try {
        // 1. Find or create a client
        console.log('Checking for clients...');
        let client: any;
        const existingClients = await prisma.cliente.findMany({ take: 1 });

        if (existingClients.length > 0) {
            client = existingClients[0];
            console.log('Using existing client:', client.id_cliente);
        } else {
            console.log('Creating a test client...');
            const clientRes = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: 'Client Test ' + Date.now(),
                    correo: 'test@example.com'
                })
            });
            client = await clientRes.json();
        }

        const id_cliente = client.id_cliente;

        // 2. Add related data (Mascot)
        console.log('Adding a mascot...');
        const mascot = await prisma.mascotas.create({
            data: {
                nombre: 'Puchini ' + Date.now(),
                id_cliente
            }
        });

        // 3. Verify data exists
        const countMascotas = await prisma.mascotas.count({ where: { id_cliente } });
        console.log('Mascotas count before delete:', countMascotas);

        // 4. Attempt deletion via API
        console.log('Attempting to delete the client via API...');
        const deleteRes = await fetch(`${API_URL}/${id_cliente}`, {
            method: 'DELETE'
        });

        if (deleteRes.ok) {
            const deleteResult = await deleteRes.json();
            console.log('Delete result:', deleteResult);

            // 5. Verify everything is gone
            const clientExists = await prisma.cliente.findUnique({ where: { id_cliente } });
            const mascotasExists = await prisma.mascotas.count({ where: { id_cliente } });

            console.log('Client exists in DB?', !!clientExists);
            console.log('Mascotas still in DB?', mascotasExists);

            if (!clientExists && mascotasExists === 0) {
                console.log('✅ Client and related data deleted successfully');
            } else {
                console.log('❌ Deletion failed to cascade correctly');
            }
        } else {
            const errorText = await deleteRes.text();
            console.log('❌ API Deletion failed:', deleteRes.status, errorText);
        }

    } catch (error: any) {
        console.error('TEST FAIL CRITICAL:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testClientDeletion();
