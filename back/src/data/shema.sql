-- Eliminación y creación de la base de datos
-- DROP DATABASE IF EXISTS amigos_app;
-- CREATE DATABASE amigos_app WITH ENCODING = 'UTF8';
-- NOTA: En la terminal de PostgreSQL (psql), ejecuta `\c amigos_app` para conectarte a la BD creada antes de ejecutar las tablas.

-- ===========================
-- TIPOS ENUM PERSONALIZADOS
-- ===========================

CREATE TYPE enum_sexo AS ENUM ('Masculino', 'Femenino', 'Otro');
CREATE TYPE enum_estado_usuario AS ENUM ('Activo', 'Inactivo', 'Bloqueado');
CREATE TYPE enum_estado_solicitud AS ENUM ('Pendiente', 'Aceptada', 'Rechazada');
CREATE TYPE enum_tipo_chat AS ENUM ('Privado', 'Grupal');
CREATE TYPE enum_tipo_mensaje AS ENUM ('Texto', 'Imagen');

-- ===========================
-- TABLA USUARIOS
-- ===========================

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,

    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,

    nombre_usuario VARCHAR(40) NOT NULL UNIQUE,

    correo VARCHAR(120) NOT NULL UNIQUE,

    contrasena VARCHAR(255) NOT NULL,

    telefono VARCHAR(20),

    fecha_nacimiento DATE NOT NULL,

    sexo enum_sexo NOT NULL,

    biografia VARCHAR(250),

    foto_perfil VARCHAR(255),

    estado enum_estado_usuario DEFAULT 'Activo',

    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- SOLICITUDES DE AMISTAD
-- ===========================

CREATE TABLE solicitudes_amistad (

    id_solicitud SERIAL PRIMARY KEY,

    id_usuario_envia INT NOT NULL,

    id_usuario_recibe INT NOT NULL,

    estado enum_estado_solicitud DEFAULT 'Pendiente',

    fecha_solicitud TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_envia
        FOREIGN KEY(id_usuario_envia)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_recibe
        FOREIGN KEY(id_usuario_recibe)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT chk_no_mismo_usuario
        CHECK(id_usuario_envia <> id_usuario_recibe),

    UNIQUE(id_usuario_envia, id_usuario_recibe)
);

-- ===========================
-- CHATS
-- ===========================

CREATE TABLE chats (

    id_chat SERIAL PRIMARY KEY,

    tipo_chat enum_tipo_chat DEFAULT 'Privado',

    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- PARTICIPANTES CHAT
-- ===========================

CREATE TABLE participantes_chat (

    id_participante SERIAL PRIMARY KEY,

    id_chat INT NOT NULL,

    id_usuario INT NOT NULL,

    fecha_union TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(id_chat)
        REFERENCES chats(id_chat)
        ON DELETE CASCADE,

    FOREIGN KEY(id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    UNIQUE(id_chat, id_usuario)
);

-- ===========================
-- MENSAJES
-- ===========================

CREATE TABLE mensajes (

    id_mensaje SERIAL PRIMARY KEY,

    id_chat INT NOT NULL,

    id_usuario INT NOT NULL,

    contenido TEXT,

    tipo enum_tipo_mensaje DEFAULT 'Texto',

    leido BOOLEAN DEFAULT FALSE,

    fecha_envio TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(id_chat)
        REFERENCES chats(id_chat)
        ON DELETE CASCADE,

    FOREIGN KEY(id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

-- ===========================
-- IMAGENES
-- ===========================

CREATE TABLE imagenes_mensajes (

    id_imagen SERIAL PRIMARY KEY,

    id_mensaje INT NOT NULL,

    ruta_imagen VARCHAR(255) NOT NULL,

    nombre_archivo VARCHAR(120),

    tamano_kb INT,

    FOREIGN KEY(id_mensaje)
        REFERENCES mensajes(id_mensaje)
        ON DELETE CASCADE
);
