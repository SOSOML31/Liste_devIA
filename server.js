const apiUrl = 'http://localhost:3000/lists'; // URL de l'API
let activeListId = null; // ID de la liste actuellement sélectionnée

// Récupérer toutes les listes depuis l'API et les afficher
async function fetchLists() {
    const response = await fetch(apiUrl);
    const lists = await response.json();
    renderLists(lists);
}

// Afficher les listes dans la barre latérale
function renderLists(lists) {
    const container = document.getElementById('list-container');
    container.innerHTML = ''; // Réinitialiser l'affichage

    lists.forEach(list => {
        const li = document.createElement('li');
        li.innerHTML = `<span onclick="selectList('${list.id}')">${list.name}</span>`;
        container.appendChild(li);
    });
}

// Créer une nouvelle liste
async function createList() {
    const name = document.getElementById('list-name').value;
    if (name) {
        await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        fetchLists(); // Mettre à jour les listes après la création
        document.getElementById('list-name').value = ''; // Réinitialiser l'input
    }
}

// Sélectionner une liste et afficher ses items
async function selectList(id) {
    activeListId = id;
    const response = await fetch(apiUrl);
    const lists = await response.json();
    const list = lists.find(l => l.id == id);

    if (list) {
        document.getElementById('list-title').innerText = list.name; // Afficher le titre de la liste
        renderItems(list.items); // Afficher les items
    }
}

// Afficher les items d'une liste
function renderItems(items) {
    const container = document.getElementById('item-container');
    container.innerHTML = ''; // Réinitialiser l'affichage

    if (items.length === 0) {
        container.innerHTML = '<p>Aucun item dans cette liste.</p>'; // Message si aucun item
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');
        const validatedClass = item.validated ? 'validated' : '';
        li.innerHTML = `
            <span class="${validatedClass}" onclick="validateItem(${item.id})">
                ${item.name} (${item.quantity})
            </span>
            <button onclick="deleteItem(${item.id})">Supprimer</button>
        `;
        container.appendChild(li);
    });
}

// Ajouter un item à la liste sélectionnée
async function addItem() {
    const name = document.getElementById('item-name').value;
    const quantity = document.getElementById('item-quantity').value || 1;

    if (name && activeListId) {
        await fetch(`${apiUrl}/${activeListId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, quantity })
        });
        selectList(activeListId); // Mettre à jour l'affichage des items
        document.getElementById('item-name').value = ''; // Réinitialiser les champs
        document.getElementById('item-quantity').value = '';
    }
}

// Valider un item (marquer comme terminé)
async function validateItem(itemId) {
    if (activeListId) {
        await fetch(`${apiUrl}/${activeListId}/items/${itemId}/validate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        selectList(activeListId); // Mettre à jour l'affichage des items
    }
}

// Supprimer un item d'une liste
async function deleteItem(itemId) {
    if (activeListId) {
        await fetch(`${apiUrl}/${activeListId}/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        selectList(activeListId); // Mettre à jour l'affichage des items
    }
}

// Archiver une liste si tous les items sont validés
async function archiveList() {
    if (activeListId) {
        const response = await fetch(`${apiUrl}/${activeListId}/archive`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert("Liste archivée avec succès !");
            activeListId = null; // Réinitialiser la liste active
            document.getElementById('list-title').innerText = 'Aucune liste sélectionnée';
            document.getElementById('item-container').innerHTML = ''; // Vider l'affichage des items
            fetchLists(); // Mettre à jour les listes
        } else {
            const error = await response.json();
            alert(error.error); // Afficher l'erreur (ex : items non validés)
        }
    }
}

// Voir ou masquer les listes archivées
let showArchived = false;
async function toggleArchives() {
    showArchived = !showArchived;
    const response = await fetch(apiUrl);
    const lists = await response.json();
    const filteredLists = lists.filter(list => list.archived === showArchived);

    const container = document.getElementById('list-container');
    container.innerHTML = '';

    filteredLists.forEach(list => {
        const li = document.createElement('li');
        li.innerHTML = `<span onclick="selectList('${list.id}')">${list.name}</span>`;
        container.appendChild(li);
    });

    document.querySelector('.toggle-btn').innerText = showArchived ? 'Masquer les archives' : 'Voir les archives';
}

// Charger les listes au démarrage
fetchLists();