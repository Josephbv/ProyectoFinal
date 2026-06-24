import re
import os

files_to_check = [
    'src/features/mascotas/pages/MascotasPage.tsx',
    'src/features/ventas/pages/VentasPage.tsx',
    'src/features/clientes/pages/ClientesPage.tsx',
    'src/features/servicios/pages/ServiciosPage.tsx',
    'src/features/empleados/pages/EmpleadosPage.tsx',
    'src/features/empleados/pages/HorarioPage.tsx',
    'src/features/configuracion/pages/UsuariosPage.tsx',
    'src/features/configuracion/pages/RolesPage.tsx',
    'src/features/agendamiento/pages/AgendamientoPage.tsx'
]

for file_path in files_to_check:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the showing text line to extract array name and start/end vars
    match = re.search(r'Mostrando\s+\{(.*?)\s*\+\s*1\}\s*-\s*\{Math\.min\((.*?),\s*(.*?)\.length\)\}\s*de\s*\{(.*?)\.length\}\s*(.*?)<', content, re.DOTALL)
    if not match:
        print(f'No match for Mostrando in {file_path}')
        continue
        
    start_var = match.group(1).strip()
    end_var = match.group(2).strip()
    array_name = match.group(3).strip()
    entity_name = match.group(5).strip()
    
    # Extract buttons
    buttons_match = re.search(r'(<div className="flex items-center gap-1">\s*<Button.*?</Button>\s*</div>)', content, re.DOTALL)
    if not buttons_match:
        print(f'No buttons match for {file_path}')
        continue
    buttons_html = buttons_match.group(1)
    
    total_pages_var = 'totalPaginas' if 'totalPaginas' in buttons_html else 'totalPages'
    
    # Construct new block
    new_block = f'''          {{/* Paginación */}}
          {{{array_name}.length > 0 && (
            <div className="flex items-center justify-between pt-4 mt-4 px-4 pb-4 border-t border-dark-color/40">
              <div className="text-sm text-dark-secondary">
                Mostrando {{{start_var} + 1}}-{{Math.min({end_var}, {array_name}.length)}} de {{{array_name}.length}} {entity_name}
              </div>

              {{{total_pages_var} > 1 && (
                {buttons_html}
              )}}
            </div>
          )}}'''

    # Find the start of the pagination div
    start_idx = content.find('<div className="flex items-center justify-between pt-4')
    if start_idx == -1:
        start_idx = content.find('<div className="flex items-center justify-between')
        if start_idx == -1:
            print(f'Could not find start_idx in {file_path}')
            continue
            
    comment_idx = content.rfind('{/* Paginación */}', 0, start_idx)
    if comment_idx != -1 and start_idx - comment_idx < 50:
        start_idx = comment_idx
        
    # Find the end by counting divs
    div_count = 0
    end_idx = -1
    i = start_idx
    while i < len(content):
        if content[i:i+4] == '<div':
            div_count += 1
        elif content[i:i+6] == '</div>':
            div_count -= 1
            if div_count == 0:
                end_idx = i + 6
                break
        i += 1
        
    if end_idx == -1:
        print(f'Could not find end_idx for {file_path}')
        continue
        
    old_block = content[start_idx:end_idx]
    if 'Mostrando' not in old_block:
        print(f'Old block does not contain Mostrando in {file_path}')
        continue
        
    new_content = content[:start_idx] + new_block + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'Successfully updated {file_path}')
