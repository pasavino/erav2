# Era V2 - AGENTS.md

## Objetivo

Estas reglas son obligatorias para cualquier agente que trabaje sobre Era V2.

El agente trabaja exclusivamente sobre la aplicación React Native / Expo.

La prioridad principal es:

**NO ROMPER LO QUE YA FUNCIONA.**

---

# ALCANCE DEL AGENTE

El agente puede trabajar únicamente sobre la aplicación:

* React Native
* TypeScript
* Expo
* componentes
* pantallas
* navegación
* contextos
* hooks
* servicios utilizados por la aplicación
* lógica frontend
* validaciones frontend
* estilos

El agente NO trabaja sobre:

* PHP
* backend
* APIs PHP
* servidor
* MySQL
* Stored Procedures
* base de datos
* infraestructura

Backend y base de datos son administrados exclusivamente por el equipo.

---

# REGLAS CRÍTICAS

## Cambios mínimos

* Modifica únicamente lo necesario para cumplir la tarea.
* No refactorices código no relacionado.
* No cambies arquitectura existente salvo solicitud explícita.
* No elimines funcionalidades existentes.
* No cambies comportamiento existente que no forme parte de la tarea.
* No cambies nombres de variables, funciones, componentes o archivos sin necesidad.
* No hagas mejoras adicionales que no fueron solicitadas.
* No reemplaces código funcional solamente porque exista una forma más moderna.
* No elimines comentarios existentes.

Si algo funciona y no forma parte de la tarea:

**NO LO CAMBIES.**

---

# ACCESO A ARCHIVOS

El agente está autorizado a:

* leer archivos de la aplicación;
* buscar archivos;
* buscar referencias dentro del código;
* inspeccionar la estructura de la aplicación;
* localizar componentes, hooks, contextos y servicios;
* crear archivos frontend cuando sean necesarios;
* modificar archivos frontend cuando sean necesarios.

Debe analizar primero el código existente antes de modificarlo.

---

# EJECUCIÓN DE COMANDOS

El agente NO debe ejecutar la aplicación ni comandos del sistema.

No debe:

* iniciar Expo;
* iniciar Metro;
* ejecutar Android;
* compilar APK o AAB;
* ejecutar builds;
* ejecutar Gradle;
* instalar dependencias;
* actualizar dependencias;
* ejecutar tests;
* ejecutar linters;
* ejecutar formatters;
* ejecutar Expo Doctor;
* ejecutar scripts;
* ejecutar PHP;
* ejecutar MySQL;
* ejecutar SQL;
* realizar operaciones Git;
* hacer commits;
* hacer push;
* hacer pull;
* modificar permisos del sistema.

No ejecutar, entre otros:

```text
npm install
npm update
npm start
npm run android

npx expo start
npx expo start -c
npx expo install
npx expo-doctor
npx expo prebuild

gradle
./gradlew

adb

php
composer

mysql
mysqldump

git commit
git push
git pull

sh scripts/build_apk.sh
```

El equipo ejecuta, prueba y compila la aplicación.

---

## COMANDOS DE LECTURA PERMITIDOS

El agente puede utilizar comandos únicamente para **leer o buscar información dentro del proyecto**, siempre que no modifiquen archivos ni ejecuten la aplicación.

Están permitidos comandos de solo lectura como:

```bash
ls
find
pwd
cat
head
tail
less
sed -n
grep
rg
wc
stat
file
```

También puede usar combinaciones de solo lectura, por ejemplo:

```bash
find . -name "*.tsx"
rg "Profile" .
grep -R "Change password" .
sed -n '1,220p' pages/Profile.tsx
head -n 100 archivo.tsx
tail -n 100 archivo.tsx
```

Estos comandos se pueden usar únicamente para:

* listar archivos y carpetas;
* localizar archivos;
* leer contenido;
* buscar texto;
* buscar referencias;
* inspeccionar estructura del proyecto;
* conocer metadata básica de archivos.

## PROHIBIDO MODIFICAR MEDIANTE TERMINAL

No utilizar comandos que creen, modifiquen, muevan o eliminen archivos.

Por ejemplo, están prohibidos:

```bash
rm
mv
cp
touch
mkdir
chmod
chown
truncate
tee
echo > archivo
cat > archivo
sed -i
perl -pi
```

La edición de código debe realizarse utilizando las herramientas de edición de archivos proporcionadas por el entorno de Codex, no mediante comandos shell.

## REGLA

**Terminal para leer y buscar: permitido.**

**Terminal para modificar, ejecutar, compilar, instalar o administrar: prohibido.**


# BACKEND

El backend es administrado exclusivamente por el equipo.

El agente NO debe:

* crear archivos PHP;
* modificar archivos PHP;
* eliminar archivos PHP;
* crear endpoints;
* modificar endpoints;
* inventar endpoints;
* modificar contratos del backend;
* modificar lógica del servidor.

Si una funcionalidad frontend necesita un endpoint que no existe:

1. Implementar la parte frontend hasta donde sea posible.
2. Indicar claramente qué necesita del backend.
3. No implementar el backend.

---

# BASE DE DATOS

La base de datos es administrada exclusivamente por el equipo.

El agente NO debe:

* conectarse a MySQL;
* ejecutar SQL;
* crear tablas;
* modificar tablas;
* crear columnas;
* modificar columnas;
* crear índices;
* modificar índices;
* crear Stored Procedures;
* modificar Stored Procedures;
* crear triggers;
* modificar triggers;
* crear funciones MySQL;
* crear vistas;
* crear migraciones;
* crear scripts SQL.

Si una funcionalidad necesita cambios de base de datos:

**Debe indicarlo al equipo y detenerse ahí.**

---

# STACK FRONTEND

La aplicación utiliza:

* React Native
* TypeScript
* Expo
* Expo SDK 54

---

# EXPO

Actualmente el proyecto utiliza:

```text
Expo SDK 54
```

No actualizar:

* Expo SDK;
* React Native;
* dependencias;
* Gradle;
* Kotlin;
* Android Gradle Plugin;

salvo solicitud explícita.

El proyecto contiene:

```text
/android
```

Esta carpeta contiene configuración nativa que debe preservarse.

No ejecutar:

```text
npx expo prebuild
npx expo prebuild --clean
```

No eliminar ni regenerar `/android`.

No modificar archivos nativos salvo que la tarea lo solicite expresamente.

---

# DEPENDENCIAS

* No instalar dependencias.
* No actualizar dependencias.
* No agregar paquetes nuevos sin autorización explícita.
* No modificar versiones en `package.json` sin autorización.
* Reutilizar las dependencias existentes siempre que sea posible.

---

# TYPESCRIPT

* Usar TypeScript.
* Mantener tipado estricto.
* Evitar `any`.
* No usar `@ts-ignore` para ocultar errores.
* Reutilizar interfaces y types existentes.
* No crear tipos duplicados innecesariamente.

---

# REACT NATIVE

* Usar componentes funcionales.
* Usar hooks cuando corresponda.
* No modificar estado directamente.
* Usar setters de React.
* Mantener los patrones existentes del proyecto.
* No crear abstracciones innecesarias.

---

# ESTRUCTURA

Los componentes reutilizables están normalmente en:

```text
/components
```

Las pantallas están normalmente en:

```text
/pages
```

Los servicios utilizados por la aplicación están normalmente en:

```text
/services
```

El contexto de autenticación está en:

```text
/context/Auth.tsx
```

Antes de crear algo nuevo:

1. Buscar si ya existe.
2. Revisar cómo se utiliza.
3. Reutilizarlo cuando sea posible.

---

# SERVICIOS FRONTEND

El agente puede modificar los servicios frontend únicamente para conectar la aplicación con endpoints que YA EXISTAN.

No debe:

* crear backend;
* modificar backend;
* inventar endpoints;
* asumir parámetros que no estén definidos;
* cambiar contratos existentes.

Si falta información del endpoint, debe indicarlo al equipo.

---

# FORMULARIOS

Usar el componente existente:

```text
Input
```

cuando corresponda.

Los errores de validación deben utilizar el mecanismo existente mediante:

```text
error
```

No crear otro sistema de validación visual si el existente puede reutilizarse.

---

# ESTILOS

Preferir:

```typescript
StyleSheet.create()
```

Usar estilos inline principalmente para valores dinámicos.

No modificar estilos no relacionados con la tarea.

No cambiar innecesariamente:

* colores;
* fuentes;
* tamaños;
* márgenes;
* padding;
* bordes;
* iconos;
* posiciones;
* layout.

Las nuevas funcionalidades deben respetar el diseño existente.

---

# IDIOMA

Todos los textos visibles para el usuario deben estar en inglés.

Esto incluye:

* botones;
* títulos;
* labels;
* placeholders;
* alerts;
* mensajes de error;
* mensajes de éxito;
* navegación.

Los comentarios existentes deben conservarse.

---

# AUTENTICACIÓN

El contexto principal está en:

```text
/context/Auth.tsx
```

No crear otro sistema paralelo de autenticación.

Respetar la lógica existente para:

* login;
* sesión;
* almacenamiento persistente;
* biometría;
* usuario;
* rol;
* logout.

No modificar autenticación no relacionada con la tarea.

---

# WALLET Y OPERACIONES FINANCIERAS

Era V2 contiene funcionalidades relacionadas con:

* wallet del pasajero;
* wallet del conductor;
* recargas;
* viajes;
* cancelaciones;
* devoluciones;
* transferencias;
* Paystack;
* logs.

No modificar lógica financiera frontend que no forme parte explícita de la tarea.

No alterar sin autorización:

* cálculos;
* saldos mostrados;
* devoluciones;
* porcentajes;
* referencias;
* estados;
* flujos de pago.

La lógica financiera del backend y base de datos no debe ser modificada por el agente.

---

# PAYSTACK

No modificar la integración Paystack salvo solicitud explícita.

Especial cuidado con:

* references;
* transaction IDs;
* callbacks;
* webhooks;
* recargas;
* cuentas bancarias;
* transferencias;
* estados de transacción.

No modificar backend Paystack.

---

# VIAJES

Era V2 maneja:

* creación;
* reserva;
* compra;
* cancelación;
* inicio;
* finalización;
* finalización normal;
* finalización forzada;
* pasajeros;
* conductor;
* wallet;
* eventos;
* logs.

No modificar reglas existentes salvo solicitud explícita.

---

# SEGURIDAD

* No introducir secretos.
* No agregar API keys privadas.
* No registrar contraseñas.
* No registrar tokens completos.
* No eliminar validaciones existentes.
* No guardar información sensible innecesariamente.

---

# MANEJO DE ERRORES

* No ocultar errores.
* No agregar `try/catch` vacíos.
* No ignorar errores silenciosamente.
* Mantener los mecanismos existentes.
* Mostrar mensajes comprensibles al usuario.

---

# FORMA DE TRABAJO

Para cada tarea:

1. Leer y analizar primero los archivos relacionados.
2. Buscar referencias y usos existentes.
3. Identificar el cambio mínimo necesario.
4. Reutilizar componentes, hooks y servicios existentes.
5. Modificar únicamente los archivos necesarios.
6. Preservar todo comportamiento no relacionado.
7. No realizar mejoras adicionales no solicitadas.

---

# AL FINALIZAR

Indicar brevemente:

1. Archivos modificados.
2. Archivos creados.
3. Qué se implementó.
4. Qué debe probar manualmente el equipo.
5. Si necesita algo del backend.
6. Si necesita algo de MySQL.

No implementar esos puntos pendientes de backend o MySQL.

---

# PRIORIDADES

1. No romper lo existente.
2. Cumplir exactamente la tarea.
3. Realizar el cambio mínimo.
4. Mantener compatibilidad.
5. Seguridad.
6. Reutilizar código existente.
7. Claridad.
8. Simplicidad.
9. Optimización.
10. Refactorización.

---

# REGLA FINAL

**Codex trabaja únicamente sobre la aplicación React Native / Expo.**

**Codex puede leer, buscar, crear y modificar archivos de la aplicación.**

**Codex NO trabaja sobre PHP.**

**Codex NO trabaja sobre MySQL.**

**Codex NO ejecuta la aplicación, builds, npm, Expo, Gradle, Git, PHP ni MySQL.**

**El equipo administra backend, base de datos, ejecución, pruebas y compilación.**

Y por encima de todo:

**SI ALGO YA FUNCIONA Y NO FORMA PARTE DE LA TAREA, NO LO CAMBIES.**
