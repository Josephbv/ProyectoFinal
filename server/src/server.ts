import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`\n🚀 KaiVet API corriendo en http://localhost:${PORT}`);
    console.log(`📖 Swagger UI:    http://localhost:${PORT}/api-docs`);
    console.log(`📊 Health check:  http://localhost:${PORT}/api/health\n`);
});
