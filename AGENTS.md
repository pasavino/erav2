# Copilot Workspace Instructions

## Principios
- Sigue las convenciones de React Native y TypeScript.
- Usa componentes reutilizables y tipados estrictos.
- Prefiere funciones puras y hooks para lógica de estado.
- Mantén los estilos en línea o en objetos StyleSheet.

## Antipatrones
- No dupliques lógica de validación en varios componentes.
- Evita el uso de `any` salvo casos justificados.
- No modifiques el estado directamente, usa los setters de React.
- No mezcles lógica de red y UI en el mismo componente.

## Convenciones del Proyecto
- Los componentes están en `/components` y las páginas en `/pages`.
- Usa el componente `Input` para formularios, pasando props estándar de `TextInput`.
- Los errores de validación se muestran en burbujas usando la prop `error`.
- Los servicios de red están en `/services` y el contexto de autenticación en `/context/Auth.tsx`.

## Comandos útiles
- Instalar dependencias: `npm install`
- Ejecutar app: `npx expo start -c` o `npm run android`
- Build APK: `sh scripts/build_apk.sh`