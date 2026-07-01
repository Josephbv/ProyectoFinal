import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanCedula(cedula: string | null | undefined): string {
  if (!cedula) return "";
  return cedula.replace(/-[CEce]$/, "");
}

export function cleanEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.replace(/-[CEce]@/, "@");
}

export function exportarComprobanteVentaPDF(venta: any, mascotas: any[], servicios: any[], citas: any[] = []) {
  try {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.");
      return;
    }

    const idMascota = venta.id_mascota || venta.IdMascota ||
      citas.find((c: any) => c.id_agendamiento === (venta.id_agendamiento || venta.idAgendamiento || venta.IdAgendamiento))?.id_mascota;
    let mascota = idMascota ? mascotas.find((m: any) => m.id_mascota === idMascota) : null;

    if (!mascota && venta.id_cliente) {
      mascota = mascotas.find((m: any) => Number(m.id_cliente) === Number(venta.id_cliente)) || null;
    }

    const fechaFormateada = venta.fecha ? venta.fecha.split('T')[0] : new Date().toISOString().split('T')[0];

    const serviciosFilas = (venta.venta_servicios || []).map((vs: any, idx: number) => {
      const sInfo = servicios.find((s: any) => s.id_servicio === vs.id_servicio);
      const nombre = vs.servicio?.nombre_servicio || sInfo?.nombre_servicio || 'Servicio';
      const precioUnitario = vs.precio_unitario || sInfo?.precio || 0;
      const cantidad = vs.cantidad || 1;
      const subtotal = cantidad * precioUnitario;

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${nombre}</td>
          <td style="text-align: center;">${cantidad}</td>
          <td style="text-align: right;">$${precioUnitario.toLocaleString('es-CO')}</td>
          <td style="text-align: right; font-weight: bold;">$${subtotal.toLocaleString('es-CO')}</td>
        </tr>
      `;
    }).join('');

    const totalFormateado = (venta.total || 0).toLocaleString('es-CO');

    printWindow.document.write(`
      <html>
        <head>
          <title>Comprobante de Pago - KaiVet</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              padding: 30px;
              line-height: 1.5;
            }
            .ticket-container {
              max-width: 600px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 30px;
              background: #ffffff;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
              border-bottom: 2px dashed #e2e8f0;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              color: #10b981;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin-bottom: 5px;
            }
            .subtitle {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 15px;
            }
            .title {
              font-size: 18px;
              font-weight: 700;
              color: #0f172a;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 25px;
            }
            .info-block {
              background: #f8fafc;
              border: 1px solid #f1f5f9;
              border-radius: 12px;
              padding: 15px;
            }
            .info-title {
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
            }
            .info-row {
              font-size: 13px;
              margin-bottom: 4px;
              color: #334155;
            }
            .info-row span {
              font-weight: 600;
              color: #0f172a;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            .details-table th {
              background: #f8fafc;
              color: #64748b;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 10px 12px;
              border-bottom: 2px solid #e2e8f0;
              text-align: left;
            }
            .details-table td {
              padding: 12px;
              font-size: 13px;
              border-bottom: 1px solid #f1f5f9;
              color: #334155;
            }
            .total-section {
              border-top: 2px dashed #e2e8f0;
              padding-top: 15px;
              margin-bottom: 25px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;
            }
            .total-label {
              font-size: 14px;
              font-weight: 500;
              color: #64748b;
            }
            .total-value {
              font-size: 20px;
              font-weight: 800;
              color: #10b981;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .status-aprobada {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-anulada {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
              .ticket-container {
                border: none;
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="header">
              <div class="logo">🐾 KaiVet Clinic</div>
              <div class="subtitle">Cuidado Profesional para tu Mascota</div>
              <div class="title">COMPROBANTE DE PAGO</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 5px;">
                Transacción N° ${String(venta.id_venta).padStart(6, '0')} &bull; Fecha: ${fechaFormateada}
              </div>
            </div>

            <div class="grid">
              <div class="info-block">
                <div class="info-title">Cliente</div>
                <div class="info-row">Nombre: <span>${venta.cliente?.nombre || 'Cliente desconocido'}</span></div>
                <div class="info-row">Cédula: <span>${cleanCedula(venta.cliente?.cedula) || '—'}</span></div>
              </div>
              <div class="info-block">
                <div class="info-title">Mascota</div>
                <div class="info-row">Nombre: <span>${mascota ? mascota.nombre : 'No aplica'}</span></div>
                <div class="info-row">Especie: <span>${mascota ? (mascota.especie || '—') : '—'}</span></div>
                <div class="info-row">Raza: <span>${mascota ? (mascota.raza || '—') : '—'}</span></div>
              </div>
            </div>

            <table class="details-table">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Servicio / Procedimiento</th>
                  <th style="text-align: center; width: 60px;">Cant.</th>
                  <th style="text-align: right; width: 100px;">P. Unitario</th>
                  <th style="text-align: right; width: 110px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${serviciosFilas || `<tr><td colspan="5" style="text-align: center; font-style: italic; color: #94a3b8;">Sin servicios registrados</td></tr>`}
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row">
                <span class="total-label">Estado de Transacción:</span>
                <span class="status-badge ${venta.estado === 'anulada' ? 'status-anulada' : 'status-aprobada'}">
                  ${venta.estado || 'aprobada'}
                </span>
              </div>
              <div class="total-row" style="margin-top: 10px;">
                <span class="total-label" style="font-weight: 700; color: #0f172a;">Total Cobrado:</span>
                <span class="total-value">$${totalFormateado} COP</span>
              </div>
            </div>

            <div class="footer">
              <p style="font-weight: 600; color: #334155; margin-bottom: 4px;">¡Gracias por tu confianza!</p>
              <p>Este documento es un comprobante de pago emitido por KaiVet Clinic.</p>
              <p style="font-size: 10px; color: #94a3b8; margin-top: 8px;">KaiVet Manager &bull; www.kaivet.com</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('[exportarComprobanteVentaPDF] Error:', error);
  }
}

