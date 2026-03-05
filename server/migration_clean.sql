BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[empleado] ADD [observaciones] TEXT;

-- AlterTable
ALTER TABLE [dbo].[historial_mascotas] ADD [receta] TEXT;

-- AlterTable
ALTER TABLE [dbo].[mascotas] ADD [fecha_desparasitacion] DATE,
[fecha_ultima_vacuna] DATE,
[peso] FLOAT(53);

-- CreateIndex
ALTER TABLE [dbo].[empleado] ADD CONSTRAINT [empleado_cedula_key] UNIQUE NONCLUSTERED ([cedula]);

-- CreateIndex
ALTER TABLE [dbo].[empleado] ADD CONSTRAINT [empleado_correo_key] UNIQUE NONCLUSTERED ([correo]);

-- CreateIndex
ALTER TABLE [dbo].[usuario] ADD CONSTRAINT [usuario_correo_key] UNIQUE NONCLUSTERED ([correo]);

-- CreateIndex
ALTER TABLE [dbo].[usuario] ADD CONSTRAINT [usuario_cedula_key] UNIQUE NONCLUSTERED ([cedula]);

-- CreateIndex
ALTER TABLE [dbo].[usuario] ADD CONSTRAINT [usuario_id_cliente_key] UNIQUE NONCLUSTERED ([id_cliente]);

-- CreateIndex
ALTER TABLE [dbo].[usuario] ADD CONSTRAINT [usuario_id_empleado_key] UNIQUE NONCLUSTERED ([id_empleado]);

-- AddForeignKey
ALTER TABLE [dbo].[historial_mascotas] ADD CONSTRAINT [historial_mascotas_id_mascota_fkey] FOREIGN KEY ([id_mascota]) REFERENCES [dbo].[mascotas]([id_mascota]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[usuario] ADD CONSTRAINT [usuario_id_cliente_fkey] FOREIGN KEY ([id_cliente]) REFERENCES [dbo].[cliente]([id_cliente]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[usuario] ADD CONSTRAINT [usuario_id_empleado_fkey] FOREIGN KEY ([id_empleado]) REFERENCES [dbo].[empleado]([id_empleado]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[venta_servicios] ADD CONSTRAINT [venta_servicios_id_venta_fkey] FOREIGN KEY ([id_venta]) REFERENCES [dbo].[ventas]([id_venta]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[agendamiento_servicios] ADD CONSTRAINT [agendamiento_servicios_id_agendamiento_fkey] FOREIGN KEY ([id_agendamiento]) REFERENCES [dbo].[agendamiento]([id_agendamiento]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[horario] ADD CONSTRAINT [horario_id_empleado_fkey] FOREIGN KEY ([id_empleado]) REFERENCES [dbo].[empleado]([id_empleado]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

