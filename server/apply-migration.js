const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Reading migration script...');
        const rawSql = fs.readFileSync(path.join(__dirname, 'migration_clean.sql'), 'utf8');

        // Remove BEGIN TRY, COMMIT, etc. and split by semicolon
        let sql = rawSql.replace(/BEGIN TRY/g, '')
            .replace(/END TRY/g, '')
            .replace(/BEGIN CATCH[\s\S]*END CATCH/g, '')
            .replace(/BEGIN TRAN;/g, '')
            .replace(/COMMIT TRAN;/g, '')
            .replace(/ROLLBACK TRAN;/g, '');

        const statements = sql.split('--').filter(s => s.trim() !== '');

        console.log('Applying migration statements individually...');
        for (let section of statements) {
            const lines = section.split('\n').filter(l => l.trim() !== '' && !l.startsWith('--'));
            if (lines.length === 0) continue;

            const statement = lines.join('\n').trim();
            if (!statement) continue;

            console.log(`Executing: ${statement.substring(0, 50)}...`);
            try {
                await prisma.$executeRawUnsafe(statement);
                console.log('Success!');
            } catch (error) {
                if (error.message.includes('ya existe') || error.message.includes('already exists') || error.message.includes('already has an object')) {
                    console.warn('Object already exists, skipping.');
                } else {
                    console.error('Error executing statement:', error.message);
                    // We continue anyway to try other statements
                }
            }
        }

        console.log('Incremental migration attempt finished.');
    } catch (error) {
        console.error('Fatal error during migration:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
