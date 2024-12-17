-- Créer la base de données
CREATE DATABASE gestion_listes;

-- Se connecter à la base de données
\c gestion_listes;

-- Créer la table des listes
CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    archived BOOLEAN DEFAULT FALSE
);

-- Créer la table des items
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    validated BOOLEAN DEFAULT FALSE
);