# ARKEION

> ARKEION no te dice qué aprender. Guarda lo que tú decides aprender.

Archivo personal para guardar y organizar tus apuntes de idiomas. Cada idioma
es su propio archivo, con categorías que tú creas (Vocabulario, Frases,
Gramática, Mis notas, o las que quieras). Cada apunte puede tener título,
contenido, ejemplos y notas personales.

Es una PWA estática: HTML, CSS y JavaScript sin dependencias ni servidor.
Los datos se guardan en el navegador del dispositivo.

## Estructura de archivos

```
arkeion/
├── index.html            # Estructura de la app
├── styles.css            # Estética "The Ancient Library"
├── app.js                # Lógica: archivo, idiomas, categorías, apuntes
├── sw.js                 # Service worker (uso sin conexión)
├── manifest.webmanifest  # Instalación en el celular
└── icon.svg              # Sello Α
```

## Ejecutar en local

```bash
cd arkeion
python3 -m http.server 8080
```

Abre http://localhost:8080 en el navegador.

## Publicar en GitHub Pages

1. Crea un repositorio vacío en GitHub, por ejemplo `arkeion`.
2. Desde esta carpeta:

   ```bash
   git init -b main
   git add .
   git commit -m "ARKEION: primera versión"
   git remote add origin https://github.com/TU-USUARIO/arkeion.git
   git push -u origin main
   ```

3. En el repositorio: **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
4. La app quedará en `https://TU-USUARIO.github.io/arkeion/`.
5. En el celular, ábrela en el navegador y elige **Añadir a pantalla de inicio**.

## Datos y copias de seguridad

- Todo se guarda en `localStorage` del navegador, bajo la clave `arkeion.v1`.
- Ajustes → **Exportar** descarga un `.json` con todo tu archivo.
- Ajustes → **Importar** reemplaza el archivo actual por el de un `.json` exportado.
- Si borras los datos del navegador, pierdes el archivo: exporta de vez en cuando.

## Actualizar la app

Cuando cambies archivos, sube el número de `CACHE` en `sw.js` (por ejemplo,
`arkeion-v2`) para que los dispositivos reciban la nueva versión.

## Próximos pasos posibles

- Actividades de repaso basadas en tus propios apuntes.
- Renombrar categorías y mover apuntes entre ellas.
- Etiquetas y filtros por apunte.
