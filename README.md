# GYMBRO

Aplicacion web para el seguimiento de actividad fisica. Incluye dashboards, gestion de rutinas, progreso del cliente y autenticacion (registro/login) con backend en Node.js + Express + MongoDB.

Proyecto universitario para la materia Programacion Web II (UANL).

## Integrantes

- Alexia Mariel Rodriguez Degollado
- Carlos Daniel Martinez Muniz

## Estructura del proyecto

```text
GYMBRO/
	Assets/
	BackEnd/
		server.js
		package.json
		.env
	FrontEnd/
		css/
		html/
		js/
	postman/
	tools/
```

## Tecnologias

- Frontend: HTML, CSS, JavaScript, Bootstrap
- Backend: Node.js, Express, Mongoose
- Base de datos: MongoDB
- Auth: bcryptjs + JWT

## Backend: configuracion rapida

1. Ir a la carpeta backend:

cd BackEnd

2. Instalar dependencias:

npm install


3. Configurar variables de entorno en `BackEnd/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/gymbro
JWT_SECRET=REEMPLAZA
```

4. Levantar servidor:

npm start

Si todo sale bien, veras mensajes como:

- MongoDB connected
- Server running on port 5000

## Endpoints de autenticacion

Base URL local:

```text
http://localhost:5000
```

### Healthcheck

- Metodo: `GET`
- Ruta: `/api/`

### Registro

- Metodo: `POST`
- Ruta: `/api/register`
- Headers: `Content-Type: application/json`

Body recomendado:

```json
{
	"nombre": "Alex",
	"apellido": "Lopez",
	"correo": "alex.lopez@correo.com",
	"password": "1234",
	"confirmPassword": "1234",
	"rol": "cliente"
}
```

### Login

- Metodo: `POST`
- Ruta: `/api/login`
- Headers: `Content-Type: application/json`

Body de ejemplo:

```json
{
	"correo": "alex.lopez@correo.com",
	"password": "1234"
}
```

## Frontend

Los archivos HTML estan en `FrontEnd/html/`. Puedes abrirlos directamente en el navegador o servirlos con una extension/live server.

Pantallas principales:

- `GYMBRO.html`
- `login.html`
- `registro.html`
- `dashboard-cliente.html`
- `dashboard-coach.html`

## Seguridad basica

- Mantener `BackEnd/.env` fuera del repositorio.


