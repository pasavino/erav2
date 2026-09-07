# Era V2 - AGENTS.md

## Objetivo

Este archivo define las reglas obligatorias para cualquier agente de código que trabaje sobre Era V2.

El agente debe actuar de forma conservadora.

Su objetivo es implementar únicamente lo solicitado, preservando todo el comportamiento existente que no forme parte explícita de la tarea.

La prioridad principal es:

**NO ROMPER LO QUE YA FUNCIONA.**

---

# REGLAS CRÍTICAS

Estas reglas tienen prioridad sobre cualquier otra instrucción de este archivo.

## 1. Cambios mínimos

* Modifica únicamente lo necesario para cumplir la tarea solicitada.
* No refactorices código que no esté directamente relacionado con la tarea.
* No reorganices archivos por preferencias personales.
* No cambies arquitectura existente si no se solicita explícitamente.
* No cambies nombres de variables, funciones, componentes, archivos, endpoints o propiedades JSON sin necesidad.
* No elimines funcionalidades existentes.
* No cambies comportamiento existente que no forme parte de la tarea.
* No simplifiques código existente si eso puede alterar su comportamiento.
* No reemplaces una implementación funcional por otra solamente porque parezca más moderna.
* No hagas mejoras adicionales que no fueron solicitadas.

Si existe una solución funcionando, modificarla mínimamente.

---

## 2. No romper funcionalidad existente

Antes de modificar un archivo:

1. Revisa el código existente.
2. Entiende cómo funciona actualmente.
3. Identifica qué partes dependen de lo que vas a modificar.
4. Cambia solamente lo necesario.
5. Conserva el resto del comportamiento exactamente como estaba.

Si una modificación puede afectar funcionalidades existentes, debes evitarla o limitarla al mínimo imprescindible.

Nunca asumir que una parte del código puede eliminarse simplemente porque aparentemente no se utiliza.

---

## 3. No eliminar comentarios

* No elimines comentarios existentes.
* No reemplaces comentarios del desarrollador.
* No traduzcas comentarios existentes.
* No reorganices comentarios innecesariamente.

Los comentarios existentes forman parte de la documentación del proyecto.

Puedes agregar comentarios nuevos cuando sean realmente útiles.

---

# TERMINAL, BASH Y COMANDOS

## Prohibido ejecutar comandos

El agente NO debe ejecutar ningún comando de terminal, shell, Bash o sistema operativo.

Esto es una regla absoluta.

No ejecutar, entre otros:

```text
bash
sh
zsh

npm
npx
yarn
pnpm

expo
expo-doctor

gradle
gradlew

adb

php
composer

mysql
mysqldump

git

rm
cp
mv
chmod
chown
mkdir

curl
wget
```

Tampoco ejecutar scripts existentes del proyecto.

Por ejemplo, NO ejecutar:

```text
npm install
npm start
npm run android

npx expo start
npx expo start -c
npx expo install
npx expo-doctor
npx expo prebuild

./gradlew
./gradlew assembleRelease

sh scripts/build_apk.sh
```

---

## El equipo ejecuta los comandos

La instalación de dependencias, ejecución, compilación y pruebas las realiza manualmente el equipo.

El agente puede indicar al finalizar que sería conveniente ejecutar determinado comando, pero:

**NO debe ejecutarlo.**

---

## No ejecutar la aplicación

El agente NO debe:

* iniciar Expo;
* iniciar Metro;
* abrir emuladores;
* ejecutar Android;
* compilar APK;
* compilar AAB;
* ejecutar builds;
* ejecutar tests;
* ejecutar linters;
* ejecutar formatters;
* ejecutar Expo Doctor;
* ejecutar Gradle;
* ejecutar scripts del proyecto.

La validación de ejecución la realiza el equipo.

---

# BASE DE DATOS

## La base de datos la administra exclusivamente el equipo

El agente NO debe modificar la base de datos.

Esto incluye MySQL y cualquier archivo relacionado con modificaciones de estructura o lógica de base de datos.

Está prohibido crear, modificar o eliminar:

* bases de datos;
* tablas;
* columnas;
* índices;
* claves;
* constraints;
* Stored Procedures;
* funciones MySQL;
* triggers;
* eventos MySQL;
* vistas;
* migraciones;
* scripts SQL.

---

## No ejecutar SQL

El agente NO debe conectarse a MySQL.

El agente NO debe ejecutar:

```text
SELECT
INSERT
UPDATE
DELETE
ALTER
CREATE
DROP
CALL
```

ni ninguna otra consulta contra la base de datos.

---

## Stored Procedures

Los Stored Procedures los administra manualmente el equipo.

El agente:

* NO debe crear Stored Procedures;
* NO debe modificar Stored Procedures;
* NO debe eliminar Stored Procedures;
* NO debe ejecutar Stored Procedures;
* NO debe generar migraciones para ellos.

Si una funcionalidad necesita un cambio de base de datos, el agente debe explicar qué necesita del backend o de MySQL.

El equipo implementará manualmente esa parte.

---

## No asumir cambios de base de datos

Nunca modificar la aplicación suponiendo que se agregará automáticamente:

* una columna;
* una tabla;
* un procedimiento;
* un parámetro;
* una vista;
* un trigger.

Si falta algo del lado de MySQL, indicarlo claramente al finalizar.

---

# ARCHIVOS

## Modificación de archivos

El agente puede modificar archivos de código necesarios para implementar la tarea.

Debe limitarse estrictamente a los archivos relacionados.

---

## No eliminar archivos

No eliminar archivos salvo que se solicite explícitamente.

No mover archivos salvo que se solicite explícitamente.

No renombrar archivos salvo que sea imprescindible para la tarea o se solicite expresamente.

---

## No modificar archivos innecesarios

No modificar archivos solamente para:

* ordenar imports;
* cambiar formato;
* aplicar prettier;
* cambiar indentación;
* cambiar comillas;
* reorganizar propiedades;
* cambiar nombres;
* limpiar código;
* modernizar sintaxis.

Si un archivo no necesita cambiar para implementar la tarea, no modificarlo.

---

# STACK DEL PROYECTO

Era V2 utiliza principalmente:

* React Native
* TypeScript
* Expo
* Expo SDK 54
* PHP 8
* MySQL 8

---

# EXPO

## Versión

Actualmente el proyecto utiliza:

```text
Expo SDK 54
```

No actualizar Expo SDK.

No actualizar React Native.

No cambiar versiones de Expo.

No actualizar dependencias automáticamente.

---

## Proyecto Android existente

El proyecto contiene:

```text
/android
```

La carpeta Android contiene configuraciones y modificaciones que deben preservarse.

NO ejecutar:

```text
npx expo prebuild
npx expo prebuild --clean
```

No regenerar Android.

No eliminar `/android`.

---

## Archivos nativos

No modificar archivos nativos salvo que la tarea lo requiera explícitamente.

Especial cuidado con:

```text
android/
AndroidManifest.xml
gradle.properties
build.gradle
settings.gradle
gradle/
```

No actualizar:

* Gradle;
* Android Gradle Plugin;
* Kotlin;
* compileSdk;
* targetSdk;
* buildTools;
* Java;

salvo solicitud explícita.

---

# DEPENDENCIAS

## No instalar dependencias

El agente NO debe instalar paquetes.

No agregar nuevas dependencias sin autorización explícita.

No actualizar dependencias existentes por iniciativa propia.

No modificar versiones solamente porque exista una versión más nueva.

---

## package.json

No modificar dependencias en `package.json` salvo que la tarea lo requiera expresamente.

Si una solución puede realizarse utilizando las dependencias existentes, usar las existentes.

---

# REACT NATIVE Y TYPESCRIPT

## TypeScript

* Usa TypeScript.
* Mantén tipado estricto.
* Evita `any`.
* No uses `@ts-ignore` para ocultar errores.
* No desactives reglas TypeScript para evitar corregir un problema.
* Reutiliza types e interfaces existentes cuando sea posible.
* No crees tipos duplicados.

---

## React

* Usa componentes funcionales.
* Usa hooks cuando corresponda.
* No modificar estado directamente.
* Usa setters de React.
* Evita efectos secundarios innecesarios.
* Mantén el patrón utilizado actualmente por el proyecto.

---

# ESTRUCTURA DEL PROYECTO

Los componentes reutilizables están normalmente en:

```text
/components
```

Las pantallas están normalmente en:

```text
/pages
```

Los servicios de red están normalmente en:

```text
/services
```

El contexto de autenticación está en:

```text
/context/Auth.tsx
```

Antes de crear algo nuevo, buscar si ya existe una implementación reutilizable.

---

# COMPONENTES

## Reutilización

Antes de crear un componente nuevo:

1. Buscar un componente existente equivalente.
2. Revisar cómo se utiliza en otras pantallas.
3. Reutilizarlo cuando sea posible.

No crear componentes duplicados.

---

## Input

Para formularios, utilizar el componente existente:

```text
Input
```

cuando sea apropiado.

Debe mantener compatibilidad con las props utilizadas actualmente.

Los errores de validación deben utilizar el mecanismo existente mediante:

```text
error
```

No crear otro sistema visual de errores si no es necesario.

---

# ESTILOS

Preferir:

```typescript
StyleSheet.create()
```

Usar estilos inline solamente cuando el valor sea dinámico o realmente sea más claro.

No modificar estilos existentes que no estén relacionados con la tarea.

No cambiar innecesariamente:

* colores;
* fuentes;
* tamaños;
* márgenes;
* padding;
* bordes;
* alineaciones;
* posiciones;
* iconos;
* layout.

La nueva funcionalidad debe integrarse visualmente con lo existente.

---

# IDIOMA DE LA APLICACIÓN

Los textos visibles para el usuario deben estar en inglés.

Esto incluye:

* títulos;
* botones;
* labels;
* placeholders;
* alerts;
* validaciones;
* errores;
* mensajes de éxito;
* textos de navegación.

No traducir automáticamente código, nombres internos o comentarios existentes.

---

# NETWORKING

La lógica de acceso al backend debe seguir los patrones existentes del proyecto.

Los servicios se encuentran normalmente en:

```text
/services
```

Antes de crear un nuevo servicio:

1. Revisar servicios existentes.
2. Buscar si ya existe un endpoint relacionado.
3. Reutilizar el patrón existente.

No crear una arquitectura nueva de networking.

---

# BACKEND PHP

El backend utiliza PHP 8.

El agente puede modificar código PHP únicamente cuando la tarea lo requiera explícitamente.

---

## Reglas PHP

* Mantener compatibilidad con PHP 8.
* Respetar la arquitectura existente.
* Mantener PDO.
* Usar prepared statements cuando corresponda.
* No concatenar entradas del usuario directamente en SQL.
* No cambiar el sistema de conexión existente sin solicitud explícita.
* No modificar código PHP no relacionado con la tarea.
* No cambiar formatos JSON existentes innecesariamente.

---

# CONTRATO FRONTEND / BACKEND

Antes de modificar un endpoint o la forma en que el frontend lo consume:

1. Revisar el contrato existente.
2. Revisar cómo lo utilizan otras pantallas.
3. Preservar compatibilidad.

No cambiar nombres de propiedades JSON existentes sin necesidad.

---

## Convención de respuesta

Era V2 utiliza habitualmente la siguiente convención:

```text
0 = operación correcta
distinto de 0 = ocurrió un error
```

El mensaje normalmente está en:

```text
msg
```

No invertir esta lógica.

---

## Alerts

Cuando una operación fue exitosa:

No mostrar:

```text
Error
```

como título.

Utilizar el título enviado por el backend o por la llamada cuando corresponda.

Si no existe un título específico y la operación fue correcta, utilizar:

```text
Success
```

cuando sea coherente con el componente existente.

---

# AUTENTICACIÓN

El contexto principal de autenticación se encuentra en:

```text
/context/Auth.tsx
```

No crear un sistema paralelo de autenticación.

Respetar la lógica existente para:

* login;
* sesión;
* almacenamiento persistente;
* biometría;
* usuario;
* rol;
* logout.

Antes de cambiar datos del usuario, revisar cómo se restauran cuando la aplicación inicia o cuando se utiliza autenticación biométrica.

---

# WALLET Y OPERACIONES FINANCIERAS

Era V2 contiene operaciones financieras críticas.

Entre otras:

* wallet del pasajero;
* wallet del conductor;
* recarga;
* compra de viajes;
* cancelaciones;
* devoluciones;
* transferencias;
* acreditaciones;
* Paystack;
* logs;
* ledger de transacciones.

---

## Regla de seguridad

No modificar lógica financiera que no forme parte explícita de la tarea.

No alterar:

* cálculos;
* saldos;
* devoluciones;
* porcentajes;
* referencias;
* estados;
* acreditaciones;
* débitos.

sin instrucciones explícitas.

---

## No implementar MySQL

Si una nueva funcionalidad financiera necesita lógica de base de datos:

**NO IMPLEMENTARLA EN MYSQL.**

El agente debe preparar únicamente la parte de aplicación/backend que corresponda y explicar qué necesita de la base de datos.

El equipo implementará esa lógica manualmente.

---

# PAYSTACK

Paystack forma parte del sistema de pagos de Era V2.

No cambiar su funcionamiento salvo solicitud explícita.

Especial cuidado con:

* references;
* transaction IDs;
* callbacks;
* webhooks;
* recargas;
* cuentas bancarias;
* transferencias;
* estados de transacción.

No alterar referencias existentes.

No cambiar mecanismos de idempotencia.

No introducir una nueva integración Paystack si ya existe una.

---

# VIAJES

Era V2 gestiona diferentes operaciones relacionadas con viajes.

Entre ellas:

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

No modificar estados ni reglas de negocio existentes salvo que se solicite específicamente.

---

# SEGURIDAD

* No introducir secretos en código.
* No agregar API keys privadas.
* No registrar contraseñas.
* No registrar tokens completos.
* No exponer errores internos de SQL.
* No exponer stack traces al usuario.
* No confiar exclusivamente en validaciones frontend.
* No eliminar validaciones backend existentes.

---

# MANEJO DE ERRORES

No ocultar errores.

No agregar `try/catch` vacíos.

No ignorar errores silenciosamente.

Mantener los mecanismos de error existentes.

Los mensajes destinados al usuario deben ser comprensibles.

Los detalles técnicos deben seguir el mecanismo de logs existente.

---

# ANTÍPATRONES

Evitar:

* refactorización innecesaria;
* cambiar código no relacionado;
* crear componentes duplicados;
* crear servicios duplicados;
* agregar dependencias innecesarias;
* cambiar arquitectura;
* modificar estilos no relacionados;
* borrar comentarios;
* cambiar contratos JSON existentes;
* cambiar nombres porque parezcan mejores;
* reemplazar código funcional sin necesidad;
* alterar lógica financiera incidentalmente;
* alterar autenticación incidentalmente;
* modificar configuración Android incidentalmente;
* modificar la base de datos;
* ejecutar comandos del sistema.

---

# CUANDO FALTA ALGO

Si para completar una tarea se necesita algo que el agente no debe modificar, por ejemplo:

* Stored Procedure;
* cambio MySQL;
* nueva tabla;
* nueva columna;
* configuración del servidor;
* ejecución de comandos;
* compilación;
* instalación de paquetes;

el agente debe:

1. Implementar hasta donde sea posible sin violar estas reglas.
2. Explicar claramente qué falta.
3. Indicar qué necesita hacer manualmente el equipo.
4. No inventar que esa parte ya existe.
5. No ejecutar esa parte por su cuenta.

---

# FORMA DE TRABAJAR

Para cada tarea:

1. Analizar primero el código existente relacionado.
2. Buscar componentes y servicios reutilizables.
3. Identificar el cambio mínimo necesario.
4. Modificar solamente los archivos necesarios.
5. Mantener funcionalidades anteriores.
6. No realizar mejoras adicionales no solicitadas.

---

# AL FINALIZAR UNA TAREA

El agente debe informar brevemente:

1. Qué archivos modificó.
2. Qué archivos creó.
3. Qué funcionalidad implementó.
4. Qué no pudo validar porque no puede ejecutar la aplicación.
5. Qué debe probar manualmente el equipo.
6. Si necesita algún cambio de backend o base de datos que deba realizar manualmente el equipo.

No afirmar:

```text
Everything works
```

si no pudo ejecutarlo.

Puede decir, por ejemplo:

```text
The implementation is complete at code level.
It still needs to be tested manually in the application.
```

---

# PRIORIDADES DEL PROYECTO

Cuando existan varias formas de resolver una tarea, seguir este orden:

1. No romper lo existente.
2. Cumplir exactamente lo solicitado.
3. Hacer el cambio mínimo posible.
4. Mantener compatibilidad.
5. Seguridad.
6. Reutilizar código existente.
7. Claridad.
8. Simplicidad.
9. Optimización.
10. Refactorización.

La refactorización nunca debe tener prioridad sobre la estabilidad.

---

# REGLA FINAL

Si algo actualmente funciona y no forma parte de la tarea:

**NO LO CAMBIES.**

Si una tarea requiere base de datos:

**NO MODIFIQUES MYSQL. AVISA AL EQUIPO.**

Si una tarea requiere ejecutar un comando:

**NO LO EJECUTES. AVISA AL EQUIPO.**

Si existe una solución que requiere cambiar diez archivos y otra que requiere cambiar dos manteniendo el mismo comportamiento:

**PREFIERE LA SOLUCIÓN DE DOS ARCHIVOS.**

El agente escribe y modifica el código necesario.

El equipo ejecuta, prueba, compila y administra la base de datos.