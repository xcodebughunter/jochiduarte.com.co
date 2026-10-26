# jochiduarte.com.co

Web personal de Jose Luis Duarte Mesa. HTML, CSS y JavaScript, publicada con GitHub Pages. La única dependencia es three.js 0.128.0 (`vendor/`, licencia MIT),
que se descarga solo cuando el personaje se muestra en 3D.
El personaje del muro, Sudo, está hecho de píxeles: se arma al cargar y reacciona al cursor (`muro.js`). Si hay WebGL,
buena conexión y movimiento permitido, se arma en 3D con vóxeles (`sudo3d.js`); si no, queda el sprite 2D.
