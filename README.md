<div align="center">

# 🧅 CEBA — El mundo de siete capas

**Aventura 3D tipo Ocarina de una cebolla dulce, con arte estilo picoCAD.**

[▶ Jugar](https://gavilanbe.github.io/ceba/)

</div>

En Bulbo no llueve: toda el agua que hay la ha llorado alguien. Por eso las cebollas hacen llorar al mundo. Ceba nació dulce y a su lado no llora nadie… hasta que pierde una capa.

- **Capas**: son la vida y el tamaño: una cebollita por capa en el marcador, y cada una aguanta dos golpes. Entera mueves bloques; con una sola cabes por las ratoneras.
- **Pelarse**: sueltas una nube que hace llorar a plagas, vecinos y estatuas, y dejas una muda que pesa en las placas.
- **Bancales**: plántate para recuperar capas y guardar.
- **Capítulo I**: Villa Ristra, la Hoja del Bancal Viejo, la Cisterna y Tapona, la babosa que lleva el tapón del desagüe de sombrero.
- **Capítulo II**: el Ajo Bravo revienta el sello de moho y se baja a la Pulpa: el Raigal de las lombrices, las setas trampolín, la Raicera, la Cerbatana, Cavador el alacrán cebollero… y Don Mildiu.
- **Pepitas de oro**: ocho escondidas por el mundo; la Yaya Morada cambia cuatro por un anillo de capa.

## Controles

| Tecla | Acción |
|---|---|
| WASD | moverse |
| Espacio | acción / rodar |
| J | la Hoja |
| Mayús | fijar objetivo |
| U, I, O | objetos |
| Flechas, ratón (clic) o Q/E | mover la cámara |
| R / rueda | zoom |
| C | cámara a la espalda |
| Q, E | pasar página en la pausa |
| Intro | pausa |

## Cómo está hecho

Web sin build (módulos ES y three.js en `vendor/`). Cada modelo es una malla de pocos lados con una hoja de textura de 128×128 pintada por código en paleta PICO-8; la luz es plana por cara y la sombra se hace por tramado. `taller.html?m=ceba` enseña cualquier modelo girando junto a su hoja de textura.

En local: `node tools/serve.mjs` y abrir http://127.0.0.1:8231/ (o doble clic en `Jugar-Ceba.command`).

Hecho con Claude Fable 5.2.
