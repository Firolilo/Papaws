# Papaws · Frontend

Interfaz del centro veterinario **Papaws** para gestionar rescatistas, animales,
veterinarios, servicios, productos y consultas.

## Stack

- Vite + React 18 + TypeScript
- React Router 6
- Tailwind CSS (paleta personalizada: musgo, hueso, terracota)
- Tipografía: Fraunces (display) + Inter (cuerpo)
- Iconos: lucide-react

## Variables de entorno

Crea un `.env` (ya viene uno por defecto):

```
VITE_API_ANIMALES=http://localhost:8080
VITE_API_CONSULTA=http://localhost:8081
```

Apuntan a los microservicios `Pawpaws-Animales` y `Pawpaws-Consulta`.

## Scripts

```bash
npm install
npm run dev       # arranca en http://localhost:5173
npm run build
npm run preview
```

## Estructura

```
src/
  api/           clientes HTTP por dominio
  components/    Layout, Modal, Button, Field, Badge, Card, Logo…
  hooks/         useFetch
  pages/         Dashboard, Rescatistas, Animales, Veterinarios,
                 Servicios, Productos, Consultas, ConsultaDetalle
  types/         tipos compartidos del dominio
```

## Notas

- El detalle de consulta permite registrar diagnóstico/seguimiento y los
  productos utilizados, descontando del inventario.
- Crear una consulta requiere animal, veterinario y al menos un servicio,
  tal como exige el backend.
