# Era V2 - AGENTS.md

## Objetivo

Este archivo define las reglas de trabajo para cualquier agente de código que modifique el proyecto Era V2.

El objetivo principal es realizar cambios seguros, mínimos y compatibles con la arquitectura existente.

---

## Regla principal

- Haz únicamente los cambios necesarios para cumplir la tarea solicitada.
- No refactorices código que no esté relacionado con la tarea.
- No elimines funcionalidades existentes.
- No elimines comentarios existentes.
- No cambies nombres de variables, funciones, archivos, endpoints, parámetros o procedimientos almacenados salvo que sea necesario.
- No cambies estructuras existentes solamente por preferencias de estilo.
- Antes de modificar una API, modelo de datos, stored procedure o contrato JSON, verifica cómo se utiliza actualmente en el proyecto.
- Si existe una implementación funcional, modifícala mínimamente en lugar de reemplazarla por una arquitectura nueva.
- No asumas requisitos que no fueron solicitados.
- Si algo no está claro, analiza primero el código existente antes de tomar una decisión.
- Prioriza compatibilidad y estabilidad sobre refactorización.

---

# Frontend

## Stack

El frontend utiliza:

- React Native
- TypeScript
- Expo
- Expo SDK 54

No actualizar React Native, Expo SDK ni dependencias salvo que la tarea lo solicite explícitamente.

---

## Expo y proyecto nativo

El proyecto contiene código nativo Android.

La carpeta:

```text
/android
```

forma parte del proyecto y contiene modificaciones que deben preservarse.

Por lo tanto:

- No ejecutar `npx expo prebuild --clean`.
- No eliminar `/android`.
- No regenerar el proyecto Android automáticamente.
- No modificar Gradle, AndroidManifest.xml, gradle.properties u otros archivos nativos salvo que la tarea lo requiera.
- No actualizar automáticamente versiones de Gradle, Kotlin, Android Gradle Plugin, compileSdk o targetSdk.
- Antes de modificar archivos nativos, revisar primero la configuración existente.

---

## TypeScript

- Usa TypeScript estricto.
- Evita `any`.
- Si `any` es inevitable, debe estar justificado por una API externa o código legado.
- Define interfaces o types para estructuras importantes.
- Evita casts innecesarios.
- No desactives comprobaciones TypeScript para ocultar errores.
- No uses `@ts-ignore` salvo que no exista otra solución razonable.

---

## React Native

- Usa componentes funcionales.
- Usa hooks para estado y efectos.
- No modificar el estado directamente.
- Usa los setters correspondientes.
- Evita efectos secundarios innecesarios.
- Evita duplicar lógica entre componentes.
- Extrae lógica reutilizable solamente cuando realmente exista reutilización.
- No agregues abstracciones innecesarias.

---

## Componentes

Los componentes reutilizables están normalmente en:

```text
/components
```

Las pantallas están normalmente en:

```text
/pages
```

Antes de crear un componente nuevo:

1. Busca si ya existe uno que resuelva la misma necesidad.
2. Reutilízalo si es posible.
3. No dupliques componentes solamente para hacer pequeños cambios visuales.

---

## Formularios

Usa el componente existente:

```text
Input
```

para formularios cuando corresponda.

Debe recibir las props estándar compatibles con `TextInput`.

Los errores de validación deben mostrarse usando el mecanismo existente mediante la prop:

```text
error
```

No crear otro sistema de validación visual si el actual puede utilizarse.

---

## Estilos

Prefiere:

```typescript
StyleSheet.create()
```

Usa estilos inline solamente cuando:

- el valor sea dinámico;
- sea un estilo muy pequeño;
- crear un estilo separado reduzca la claridad.

No rehagas estilos existentes si la tarea no lo requiere.

No cambies diseño, tamaños, márgenes, colores o disposición de elementos que no estén relacionados con la tarea.

---

## Textos de la aplicación

Los textos visibles para el usuario deben estar siempre en inglés.

Ejemplos:

- botones;
- títulos;
- alertas;
- mensajes de error;
- mensajes de éxito;
- placeholders;
- etiquetas;
- textos de navegación.

El código fuente, comentarios técnicos y nombres internos pueden mantener el estilo existente del proyecto.

No traduzcas textos existentes salvo que la tarea lo solicite.

---

## Networking

Los servicios de red deben mantenerse en:

```text
/services
```

Evita mezclar lógica de networking compleja dentro de componentes visuales.

Antes de crear un nuevo servicio verifica si ya existe uno relacionado.

No cambies endpoints existentes sin revisar todos sus usos.

---

## Autenticación

El contexto principal de autenticación está en:

```text
/context/Auth.tsx
```

No crear otro sistema paralelo de autenticación.

Los datos persistidos del usuario deben utilizar la infraestructura existente.

Especial atención a:

- login normal;
- login biométrico;
- restauración de sesión;
- datos persistidos del usuario;
- rol del usuario.

---

## Manejo de respuestas del backend

El backend normalmente devuelve una estructura con código de resultado y mensaje.

Convención utilizada en Era V2:

```text
0 = operación correcta
distinto de 0 = error
```

El mensaje normalmente llega en:

```text
msg
```

No inviertas esta lógica.

Cuando el backend devuelve éxito:

- no mostrar alertas con título `Error`;
- usar un título coherente como `Success`, salvo que el backend o la pantalla especifiquen otro.

Cuando exista un mensaje devuelto por el backend, priorizar ese mensaje antes de inventar uno nuevo.

---

# Backend

## Stack

El backend utiliza:

- PHP 8
- PDO
- MySQL 8
- Stored Procedures

Mantener compatibilidad con PHP 8.

---

## PHP

- Usa sintaxis válida para PHP 8.
- Usa PDO para acceso a base de datos.
- Usa prepared statements y parámetros bind.
- No concatenes datos enviados por el usuario directamente en SQL.
- No cambies el sistema actual de conexión a base de datos salvo solicitud explícita.
- Mantén el formato JSON existente de los endpoints.
- No cambies nombres de propiedades JSON utilizadas por el frontend.
- No expongas información interna de errores SQL al usuario final.
- Los errores técnicos pueden registrarse en logs.

---

## APIs

Los endpoints PHP deben mantener compatibilidad hacia atrás.

Antes de modificar la salida JSON:

1. Busca qué pantallas consumen ese endpoint.
2. Comprueba los nombres de propiedades existentes.
3. Evita eliminar propiedades.
4. Evita cambiar tipos de datos sin necesidad.

Si se necesita agregar información, preferir agregar propiedades nuevas sin romper las existentes.

---

# MySQL

## Versión

La base de datos utiliza MySQL 8.

---

## Stored Procedures

Gran parte de la lógica de negocio puede estar implementada mediante Stored Procedures.

Al modificar un procedimiento:

- conservar los comentarios existentes;
- conservar nombres de parámetros salvo necesidad real;
- conservar tipos de datos existentes;
- no cambiar tipos por preferencias personales;
- mantener el comportamiento existente no relacionado con la tarea.

Por ejemplo, si una columna o parámetro actualmente utiliza:

```sql
DOUBLE
```

no cambiarlo automáticamente a:

```sql
DECIMAL
```

aunque pudiera parecer técnicamente más apropiado.

La estructura existente de la base de datos tiene prioridad.

---

## Transacciones

Cuando una operación involucre múltiples cambios relacionados financieramente o de estado, evaluar el uso de:

```sql
START TRANSACTION;
COMMIT;
ROLLBACK;
```

Si el procedimiento ya utiliza transacciones, mantener correctamente su atomicidad.

Cuando corresponda utilizar un handler:

```sql
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    ROLLBACK;
    RESIGNAL;
END;
```

No agregar `ROLLBACK` dentro de cada `IF` si existe un handler central que ya captura el error después de un `SIGNAL`.

Evitar dobles `COMMIT` o `ROLLBACK`.

---

## SIGNAL

Para errores que deban abortar una transacción puede utilizarse:

```sql
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'ERROR_CODE';
```

No reemplazar el sistema existente de errores si ya existe una convención dentro del procedimiento.

---

## ROW_COUNT()

Cuando una operación espera modificar exactamente un registro, puede validarse con:

```sql
IF ROW_COUNT() <> 1 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'UPDATE_FAILED';
END IF;
```

Antes de agregar esta validación, comprobar si realmente se espera modificar exactamente un registro.

---

# Wallet y movimientos financieros

Era V2 posee operaciones financieras relacionadas con:

- wallet del pasajero;
- wallet del conductor;
- recargas;
- compra de viajes;
- cancelaciones;
- devoluciones;
- transferencias;
- acreditación al finalizar un viaje;
- Paystack;
- libro mayor / ledger de transacciones.

Estas operaciones son críticas.

---

## Reglas financieras

- No modificar saldo sin registrar correctamente la operación correspondiente.
- Evitar operaciones parcialmente aplicadas.
- Las operaciones relacionadas deben ser atómicas.
- No duplicar créditos o débitos.
- No alterar reglas de devolución sin solicitud explícita.
- No modificar lógica de Paystack sin revisar el flujo completo.
- No alterar referencias de transacción.
- No reutilizar una referencia que deba ser única.

Para cambios financieros, revisar siempre:

```text
wallet
wallet log
ledger
booking
trip
Paystack reference
```

según corresponda.

---

# Viajes

El sistema maneja estados y eventos relacionados con viajes.

Entre ellos:

- reserva;
- cancelación;
- inicio de viaje;
- finalización normal;
- finalización forzada;
- devolución de dinero;
- acreditación al conductor;
- eventos del viaje.

No cambiar reglas de transición de estados sin revisar el flujo completo.

---

## Eventos

Cuando una operación relevante ya utiliza un procedimiento central de eventos, reutilizarlo en lugar de duplicar lógica de auditoría.

Los eventos deben preservar información relevante como:

- viaje;
- reserva;
- usuario actor;
- tipo de actor;
- estado;
- origen;
- destino;
- fecha;
- coordenadas;
- motivo;
- descripción;
- datos adicionales;
- referencia de operación.

---

# Paystack

Paystack forma parte del sistema de pagos.

No modificar:

- referencias;
- callbacks;
- webhooks;
- identificación de transacciones;
- lógica de éxito/error;

sin analizar previamente el flujo completo.

Las operaciones Paystack deben ser idempotentes cuando corresponda.

Un webhook repetido no debe acreditar dinero dos veces.

---

# Seguridad

- Nunca incluir secretos en el código.
- No agregar API keys privadas al repositorio.
- No registrar passwords.
- No registrar tokens completos.
- No registrar datos sensibles innecesariamente.
- Usar prepared statements.
- Validar entradas del usuario.
- Validar permisos en backend, no solamente en frontend.
- Nunca confiar en IDs o roles enviados por el cliente sin validación del backend.

---

# Manejo de errores

No ocultar errores silenciosamente.

Frontend:

- mostrar mensajes comprensibles;
- registrar información técnica cuando corresponda.

Backend:

- devolver mensajes coherentes;
- registrar detalles técnicos;
- evitar enviar stack traces o información SQL sensible al usuario.

---

# Antipatrones

Evitar:

- duplicar lógica de validación;
- usar `any` innecesariamente;
- modificar estado directamente;
- mezclar excesivamente networking y UI;
- crear servicios duplicados;
- crear componentes duplicados;
- reescribir archivos completos para corregir un detalle pequeño;
- cambiar arquitectura durante una corrección puntual;
- instalar paquetes para resolver algo que puede hacerse con dependencias existentes;
- cambiar versiones de dependencias sin necesidad;
- introducir librerías nuevas sin verificar primero si el proyecto ya tiene una solución.

---

# Dependencias

Antes de agregar una dependencia:

1. Comprueba si el proyecto ya tiene una librería que resuelva el problema.
2. Evalúa si realmente es necesaria.
3. Verifica compatibilidad con Expo SDK 54.
4. No actualices otras dependencias incidentalmente.

Usar preferentemente:

```bash
npx expo install paquete
```

para paquetes relacionados con Expo.

---

# Comandos habituales

Instalar dependencias:

```bash
npm install
```

Iniciar Expo limpiando caché:

```bash
npx expo start -c
```

Ejecutar Android:

```bash
npm run android
```

Verificar el proyecto Expo:

```bash
npx expo-doctor
```

Build APK:

```bash
sh scripts/build_apk.sh
```

No ejecutar comandos destructivos sin necesidad.

---

# Cambios de archivos

Antes de modificar código:

1. Lee el archivo completo cuando sea razonable.
2. Identifica dependencias y funciones relacionadas.
3. Busca referencias cuando cambies nombres o contratos.
4. Realiza el cambio mínimo.
5. Revisa que no se haya modificado comportamiento no solicitado.

---

# Entrega de cambios

Cuando termines una tarea:

- Indica qué archivos fueron modificados.
- Resume brevemente qué cambió.
- Indica si existen riesgos o puntos que requieren prueba.
- No afirmar que algo funciona si no fue ejecutado o comprobado.
- Si no se pudo validar algo, decirlo explícitamente.

---

# Prioridades

Ante varias posibles soluciones, usar este orden de prioridad:

1. No romper funcionalidad existente.
2. Cumplir exactamente la tarea solicitada.
3. Mantener compatibilidad con la arquitectura actual.
4. Seguridad.
5. Claridad.
6. Simplicidad.
7. Reutilización.
8. Optimización.
9. Refactorización.

Una solución más elegante no es mejor si introduce riesgo innecesario en código que ya funciona.