# Jumpy Jumper — Sitio web

Re-diseño moderno del sitio jumpy-jumper.com con carrito funcional, soporte bilingüe (inglés/español) y checkout por WhatsApp/Email.

## Stack

- **HTML / CSS / JavaScript** puro (sin frameworks, sin build step)
- **localStorage** para persistir el carrito entre visitas
- **Google Fonts** (Inter + Fredoka)
- **Imágenes** desde `jumpy-jumper.com` (originales) + Unsplash (stock)

## Estructura

```
jumpy-jumper/
├── index.html              ← Inicio (hero, productos destacados, CTA)
├── shop.html               ← Catálogo completo con filtros
├── product.html            ← Detalle de producto (URL: ?slug=...)
├── contact.html            ← Contacto + formulario
├── css/
│   └── styles.css          ← Estilos (mobile-first, dark/light responsive)
├── js/
│   ├── i18n.js             ← Strings EN/ES + función jjApplyI18N()
│   ├── cart.js             ← Lógica del carrito + checkout
│   └── main.js             ← Renderizado de productos desde JSON
├── data/
│   └── products.json       ← Catálogo (48 productos, 3 categorías)
└── README.md
```

## Cómo abrirlo en VS Code

### Opción 1 — Live Server (recomendado)

1. Instala la extensión **Live Server** de Ritwick Dey en VS Code
2. Abre esta carpeta: `C:\Users\Alejandro Casas\Proyectos\jumpy-jumper`
3. Click derecho en `index.html` → **Open with Live Server**
4. Se abre en el navegador en `http://localhost:5500` y se recarga solo cuando guardás cambios

### Opción 2 — Abrir directamente

Doble click en `index.html` — funciona pero:
- Algunas funciones (fetch del JSON) requieren servidor por el protocolo `file://`
- Si ves errores en consola, usá Live Server

### Opción 3 — Servidor con Node

```powershell
cd "C:\Users\Alejandro Casas\Proyectos\jumpy-jumper"
npx http-server -p 8080
```

Después abrís `http://localhost:8080`.

## Personalización

### Cambiar número de WhatsApp

En `js/cart.js`, línea 5:
```js
whatsapp: '18184455036',     // +1 (818) 445-5036 → E.164 sin '+'
```

Y en todos los HTML (buscar `wa.me/18184455036`):
- `index.html`
- `shop.html`
- `product.html`
- `contact.html`

### Cambiar email

En `js/cart.js`, línea 6:
```js
email: 'jumpyjumper62@gmail.com',
```

Y en `contact.html` (buscar `jumpyjumper62@gmail.com`).

### Cambiar precios o productos

Editar `data/products.json`. Cada producto tiene:
```json
{
  "category": "jumpers",           // "jumpers" | "tables-chairs" | "concessions"
  "name": "Jumper 13x13",
  "slug": "jumper-13x13",          // URL slug (sin espacios, lowercase, guiones)
  "url": "https://...",            // link original (referencia)
  "price": 120.00,
  "image": "https://...",          // URL absoluta
  "description": "..."
}
```

Después de editar, el sitio se actualiza automáticamente al recargar.

### Cambiar textos (EN/ES)

En `js/i18n.js` están todos los strings. Cada entrada tiene versión EN y ES:
```js
en: { "nav.home": "Home", ... },
es: { "nav.home": "Inicio", ... }
```

## Funcionalidades

- ✅ **Catálogo filtrable** — Jumpers / Tables & Chairs / Concessions
- ✅ **Carrito persistente** — Se guarda en localStorage del navegador
- ✅ **Checkout por WhatsApp** — Arma un mensaje con el pedido y abre WhatsApp
- ✅ **Checkout por Email** — Mismo mensaje pero vía mailto
- ✅ **Bilingüe EN/ES** — Toggle en el header, persiste preferencia. Las mini-descripciones se traducen en vivo
- ✅ **Responsive** — Mobile-first, se ve bien en celular y desktop
- ✅ **Toasts** — Confirmaciones visuales al agregar/quitar del carrito
- ✅ **Hero, About, CTA** — Secciones de conversión
- ✅ **Animaciones modernas** — Entrada escalonada, parallax sutil, hover con glow, badge pulse en carrito, header sticky con sombra al scroll

## Animaciones incluidas

- **Entrada escalonada** de cards y features (fade + slide-up)
- **Hero animado** — Tag, título, párrafo y CTA aparecen en cascada al cargar; la imagen hace scale-in
- **Parallax sutil** en la imagen del hero al hacer scroll
- **Product cards con glow** azul-naranja al hacer hover + zoom de imagen
- **Header sticky** con sombra al scrollear
- **Logo bounce** al pasar el mouse
- **Iconos de features** rotan y se llenan de color al hover
- **Botones con ripple** al click
- **Badge del carrito pulsa** cuando agregás un producto
- **Items del carrito** entran con slide-in
- **Reveal on scroll** para secciones (IntersectionObserver)
- **Smooth scroll** en anchor links
- **Selección azul**, focus visible accesible
- **Respeta `prefers-reduced-motion`** (desactiva animaciones para usuarios sensibles)

## Pendientes / Para producción

- [ ] Reemplazar las URLs de imágenes de `jumpy-jumper.com` por imágenes propias (derechos)
- [ ] Comprar dominio + hosting (Netlify / Vercel / GitHub Pages son gratis para estáticos)
- [ ] Configurar HTTPS
- [ ] Agregar Google Analytics o Plausible para medir visitas
- [ ] Schema.org markup para SEO local
- [ ] Google Business Profile link
- [ ] (Opcional) Stripe Checkout para pagos online reales

## Licencias

- Código: propio, libre de uso
- Imágenes de Unsplash: ver https://unsplash.com/license (uso libre)
- Imágenes de jumpy-jumper.com: pertenecen al negocio — considerar reemplazarlas por fotos propias
