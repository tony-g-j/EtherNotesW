
const API_URL = 'http://localhost:3000';
let currentUser = null;


let viewContainer = null;
let mentionsContainer = null;


document.addEventListener('DOMContentLoaded', () => {
    
   
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const messageDiv = document.getElementById('formMessage'); 

        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if(messageDiv) {
                messageDiv.textContent = "Registrando...";
                messageDiv.style.color = "blue";
            }

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await response.json();

                if (data.success) {
                    if(messageDiv) {
                        messageDiv.textContent = '¡Registro exitoso! Redirigiendo...';
                        messageDiv.style.color = "green";
                    } else {
                        alert('¡Registro exitoso!');
                    }
                    setTimeout(() => window.location.href = 'Index.html', 1500);
                } else {
                    if(messageDiv) {
                        messageDiv.textContent = 'Error: ' + data.message;
                        messageDiv.style.color = "red";
                    } else {
                        alert('Error: ' + data.message);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if(messageDiv) messageDiv.textContent = 'Error de conexión.';
            }
        });
    }


    const loginForm = document.getElementById('loginForm');
    if (loginForm) {

        if (localStorage.getItem('user')) {
            window.location.href = 'mainS.html';
        }

        const messageDiv = document.getElementById('loginMessage');

        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if(messageDiv) {
                messageDiv.textContent = "Verificando...";
                messageDiv.style.color = "blue";
            }

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'mainS.html';
                } else {
                    if(messageDiv) {
                        messageDiv.textContent = 'Error: ' + data.message;
                        messageDiv.style.color = "red";
                    } else {
                        alert('Error: ' + data.message);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if(messageDiv) messageDiv.textContent = 'Error de conexión.';
            }
        });
    }

    const appView = document.getElementById('app-view');
    if (appView) {
        viewContainer = appView;
        mentionsContainer = document.getElementById('mentions-list');

        const userStr = localStorage.getItem('user');
        if (!userStr) {
            window.location.href = 'Index.html';
        } else {
            currentUser = JSON.parse(userStr);
            const welcomeMsg = document.getElementById('welcomeUser');
            if(welcomeMsg) welcomeMsg.textContent = 'Hola, ' + currentUser.username;
            
            loadChests();
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user');
                window.location.href = 'Index.html';
            });
        }
    }
});

async function loadChests() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${API_URL}/chests/${currentUser.id}`);
        const chests = await response.json();
        renderDashboard(chests);
    } catch (error) {
        console.error('Error cargando baúles:', error);
        if(viewContainer) viewContainer.innerHTML = '<p style="color:red; text-align:center;">Error al conectar con el servidor.</p>';
    }
}

async function loadNotes(chestId, chestName) {
    try {
        const response = await fetch(`${API_URL}/chests/${chestId}/notes`);
        const notes = await response.json();
        renderChestView(chestId, chestName, notes);
    } catch (error) {
        console.error('Error cargando notas:', error);
    }
}

function renderDashboard(chests) {
    if (!viewContainer) return; 

    let html = `<h1 style="margin-bottom:20px;">Mis Baúles</h1> <div class="chests-grid">`;
    
    if (!chests || chests.length === 0) {
        html += `<p>No tienes baúles creados aún.</p>`;
    } else {
        chests.forEach(chest => {
            html += `
                <div class="chest-card" onclick="loadNotes(${chest.id}, '${chest.name}')">
                    <i class="fa-solid ${chest.icon || 'fa-folder'} chest-icon"></i>
                    <h3>${chest.name}</h3>
                    <small>${chest.note_count || 0} notas</small>
                </div>
            `;
        });
    }
    html += `</div>`;
    viewContainer.innerHTML = html;
    if(mentionsContainer) mentionsContainer.innerHTML = '<p style="color: #95a5a6; font-size: 0.9rem;">Selecciona una nota para ver sus conexiones.</p>';
}

function renderChestView(chestId, chestName, notes) {
    if (!viewContainer) return;

    let html = `
        <div class="breadcrumb" onclick="loadChests()">
            <i class="fa-solid fa-arrow-left"></i> Volver a Baúles
        </div>
        <h1 style="margin-bottom:20px;">${chestName}</h1>
        <div class="notes-list">
    `;

    if(!notes || notes.length === 0) {
        html += `<p style="color:#777;">Este baúl está vacío.</p>`;
    } else {
        notes.forEach(note => {
            const noteData = encodeURIComponent(JSON.stringify(note));
            const preview = note.content ? note.content.substring(0, 100) : '';
            
            html += `
                <div class="note-item" onclick="openNoteFromData('${noteData}', ${chestId}, '${chestName}')">
                    <h3 style="margin:0; font-size:1.1rem; color:#2c3e50;">${note.title}</h3>
                    <div class="note-meta">${new Date(note.created_at).toLocaleDateString()}</div>
                    <p style="color:#7f8c8d; margin-top:5px; font-size:0.9rem;">
                        ${preview}...
                    </p>
                </div>
            `;
        });
    }
    html += `</div>`;
    viewContainer.innerHTML = html;
}

function openNoteFromData(noteDataEncoded, chestId, chestName) {
    const note = JSON.parse(decodeURIComponent(noteDataEncoded));
    renderNoteView(note, chestId, chestName);
}

function renderNoteView(note, chestId, chestName) {
    if (!viewContainer) return;

    let backAction = chestId ? `loadNotes(${chestId}, '${chestName}')` : `loadChests()`;
    let breadcrumbText = chestName ? `Volver a ${chestName}` : `Volver a Baúles`;

    let html = `
        <div class="breadcrumb" onclick="${backAction}">
            <i class="fa-solid fa-arrow-left"></i> ${breadcrumbText}
        </div>
        <div class="note-content-view">
            <h1 style="border-bottom:1px solid #ffffffff; padding-bottom:10px;">${note.title}</h1>
            <div style="margin-top:20px; font-size:1.1rem;">
                ${processContent(note.content)}
            </div>
        </div>
    `;
    viewContainer.innerHTML = html;

    findLinkedMentions(note);
}

function processContent(text) {
    if (!text) return "";
    return text.replace(/\[\[(\d+)\]\]/g, (match, id) => {
        return `<span class="mention-link">Ref: ${id}</span>`;
    });
}

async function findLinkedMentions(currentNote) {
    if (!mentionsContainer || !currentUser) return;
    
    mentionsContainer.innerHTML = '<p>Buscando relaciones...</p>';
    
    try {
        const response = await fetch(`${API_URL}/notes/search?userId=${currentUser.id}&query=${currentNote.title}`);
        const results = await response.json();

        const mentions = results.filter(n => n.id !== currentNote.id);

        if (mentions.length === 0) {
            mentionsContainer.innerHTML = '<p style="color: #95a5a6; font-size: 0.9rem;">No hay menciones vinculadas a esta nota.</p>';
            return;
        }

        let html = '';
        mentions.forEach(n => {
            const noteData = encodeURIComponent(JSON.stringify(n));
            html += `
                <div class="linked-card" onclick="openNoteFromData('${noteData}', null, 'Busqueda')">
                    <strong>${n.title}</strong>
                    <div class="linked-context">Nota relacionada</div>
                </div>
            `;
        });
        mentionsContainer.innerHTML = html;

    } catch (error) {
        console.error("Error buscando menciones:", error);
        mentionsContainer.innerHTML = '<p>Error cargando relaciones.</p>';
    }
}

async function handleGlobalSearch(event) {
    if (event.key === 'Enter') {
        const query = event.target.value;
        if (!query) return loadChests();

        try {
            const response = await fetch(`${API_URL}/notes/search?userId=${currentUser.id}&query=${query}`);
            const results = await response.json();
            
            renderChestView(null, `Resultados: "${query}"`, results);
        } catch (error) {
            console.error('Error en búsqueda:', error);
        }
    }
}