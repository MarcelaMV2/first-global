# 🤖 FIRST Global Robotics - Score Visualization Platform


<p align="center">
  <img src="https://img.shields.io/badge/Astro-Static%20Site-FF5D01?style=for-the-badge&logo=astro">
  <img src="https://img.shields.io/badge/Data-Visualization-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel">
</p>


# 📌 Descripción del proyecto

**FIRST Global Robotics Score Visualization** es una plataforma web desarrollada para visualizar y analizar los resultados obtenidos durante un proceso nacional de evaluación de equipos participantes en la competencia de robótica **FIRST Global**.

La aplicación permite consultar de manera clara y organizada las calificaciones obtenidas por los equipos mejor evaluados, mostrando el desempeño en diferentes áreas técnicas y criterios de evaluación.

FIRST Global es una competencia internacional de robótica donde equipos estudiantiles de diferentes países desarrollan robots y participan en desafíos basados en ingeniería, programación y trabajo colaborativo. :contentReference[oaicite:1]{index=1}


---

# 🎯 Objetivo del proyecto

Transformar información de evaluación almacenada en hojas de cálculo en una plataforma web interactiva que permita:

- Visualizar resultados de manera organizada.
- Comparar el rendimiento entre equipos.
- Consultar puntuaciones por área.
- Facilitar el análisis de evaluadores y participantes.


---

# ✨ Características principales


## 🏆 Ranking de equipos

Visualización de los mejores equipos evaluados durante el campeonato nacional.


Incluye:

- Posición obtenida.
- Puntaje acumulado.
- Información general del equipo.


---

## 📊 Evaluación por áreas

La plataforma permite consultar las calificaciones divididas por categorías.


Ejemplos:


### ⚙️ Área mecánica

Visualización de:

- Evaluaciones técnicas.
- Componentes analizados.
- Rondas prácticas.
- Puntajes obtenidos.


### 🔧 Evaluaciones específicas

Consulta de métricas individuales realizadas durante la evaluación.


---

# 📥 Fuente de datos y procesamiento

Los datos mostrados en la plataforma provienen de un documento de **Google Sheets compartido en modo lectura**, utilizado como fuente centralizada de información durante el proceso de evaluación.

La aplicación consume los datos mediante una URL pública, evitando modificaciones directas sobre la fuente original y manteniendo la integridad de la información recopilada.


Flujo de información:



---

# 🛠️ Tecnologías utilizadas


| Tecnología | Uso |
|-|-|
| Astro | Framework para sitio web estático |
| JavaScript / TypeScript | Lógica del frontend |
| HTML5 | Estructura web |
| CSS | Diseño y estilos |
| Excel | Fuente inicial de datos |
| Vercel | Despliegue |


---

# 🏗️ Arquitectura del proyecto


```
src/

├── components/
│
├── layouts/
│
├── pages/
│
├── data/
│   └── Información procesada desde Excel
│
└── styles/
```


---

# 🚀 Ejecución local


Clonar repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```


Ingresar al proyecto:

```bash
cd first-global
```


Instalar dependencias:

```bash
npm install
```


Ejecutar servidor local:

```bash
npm run dev
```


Abrir:

```
http://localhost:4321
```


---

# 🌐 Demo online

Proyecto desplegado:

https://first-global.vercel.app/


---

# 📌 Estado del proyecto

✅ Proyecto funcional.

Actualmente permite visualizar información histórica de evaluación y resultados de competencia.


---

# 👨‍💻 Autor

Proyecto desarrollado como herramienta de visualización y análisis de datos aplicada al área de robótica educativa.


---

# 📄 Licencia

Proyecto desarrollado con fines educativos y demostrativos.
