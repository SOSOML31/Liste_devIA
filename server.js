const express = require('express'); // Framework pour créer le serveur web
const bodyParser = require('body-parser'); // Middleware pour traiter les données JSON
const fs = require('fs'); // Module pour gérer les fichiers (lecture/écriture)
const cors = require('cors'); // Middleware pour permettre les requêtes entre différentes origines
const app = express(); // Initialiser l'application Express
const PORT = 3000; // Définir le port sur lequel le serveur sera lancé

app.use(bodyParser.json()); // Middleware pour analyser les requêtes avec un body JSON
app.use(cors()); // Autoriser les requêtes CORS pour l'application frontend

const DATA_FILE = 'data.json';
let lists = []; // Variable pour stocker les listes en mémoire

// Charger les données depuis le fichier JSON
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        lists = JSON.parse(fs.readFileSync(DATA_FILE));
    } else {
        lists = [];
        saveData();
    }
}

// Sauvegarder les données dans le fichier JSON
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(lists, null, 2));
}

// Routes API
app.get('/lists', (req, res) => {
    res.json(lists); // Retourner toutes les listes
});

app.post('/lists', (req, res) => {
    const newList = {
        id: Date.now(), // ID unique basé sur le timestamp
        name: req.body.name,
        items: [],
        archived: false
    };
    lists.push(newList);
    saveData();
    res.status(201).json(newList);
});

app.post('/lists/:id/items', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (list) {
        const newItem = {
            id: Date.now(),
            name: req.body.name,
            quantity: req.body.quantity || 1,
            validated: false
        };
        list.items.push(newItem);
        saveData();
        res.status(201).json(newItem);
    } else {
        res.status(404).json({ error: "Liste non trouvée" });
    }
});

app.put('/lists/:id/archive', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (list) {
        const allValidated = list.items.every(item => item.validated);
        if (allValidated) {
            list.archived = true;
            saveData();
            res.json({ message: "Liste archivée" });
        } else {
            res.status(400).json({ error: "Tous les items ne sont pas validés" });
        }
    } else {
        res.status(404).json({ error: "Liste non trouvée" });
    }
});

app.put('/lists/:id/items/:itemId/validate', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (list) {
        const item = list.items.find(i => i.id == req.params.itemId);
        if (item) {
            item.validated = true;
            saveData();
            res.json(item);
        } else {
            res.status(404).json({ error: "Item non trouvé" });
        }
    } else {
        res.status(404).json({ error: "Liste non trouvée" });
    }
});

app.delete('/lists/:id/items/:itemId', (req, res) => {
    const list = lists.find(l => l.id == req.params.id);
    if (list) {
        const originalLength = list.items.length;
        list.items = list.items.filter(i => i.id != req.params.itemId); // Supprimer l'item
        saveData();
        console.log(`Items avant : ${originalLength}, Items après : ${list.items.length}`);
        res.json({ message: "Item supprimé" });
    } else {
        res.status(404).json({ error: "Liste non trouvée" });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    loadData();
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});