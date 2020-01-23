let socket = io.connect('http://localhost:8080');

socket.emit('username');

socket.on('all_messages', (msg) => {
    msg.forEach(row => {
        $('#messages').append($('<li>').html(row));
    }, (err) => {
        if (err) console.log(err);
    });
});

socket.on('chat_message', (msg) => {
    $('#messages').append($('<li>').html(msg));
});

socket.on('is_online', (username) => {
    $('#messages').append($('<li>').html(username));
    $('#messages').scrollTop(function() { return this.scrollHeight; });
});

$('#chatForm').submit((e) => {
    e.preventDefault();
    socket.emit('chat_message', $('#txt').val());
    $('#txt').val('');
    return false;
});

document.getElementById('txt').oninput = (e) => {
    if (e.target.value == '') socket.emit('stop_typing');
    else socket.emit('is_typing');
}

let typingIndicator = document.getElementById('typing');
    socket.on('is_typing', (msg) => {
    typingIndicator.innerText = msg;
});

socket.on('stop_typing', () => {
    typingIndicator.innerText = '';
});

function checkDel() {
    let pass = window.prompt('Ovo je TRAJNA operacija, da biste nastavili unesite tajnu šifru', 'Šifra');
    if (pass == 'top-secret-pass') $('#del').submit();
    else alert('NETAČNA ŠIFRA!');
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

let msgs = document.getElementById('messages');
;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
    msgs.addEventListener(event, preventDefaults, false);
});

;['dragenter', 'dragover'].forEach(eventName => {
    msgs.addEventListener(eventName, highlight, false)
})

;['dragleave', 'drop'].forEach(eventName => {
    msgs.addEventListener(eventName, unhighlight, false)
})

function highlight(e) {
    msgs.classList.add('highlight')
}

function unhighlight(e) {
    msgs.classList.remove('highlight')
}

msgs.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;

    handleFiles(files);
}

function handleFiles(files) {
    ([...files]).forEach(uploadFile);
}

function uploadFile(file) {
    let url = '/upload';
    let formData = new FormData();

    formData.append('file', file);

    fetch(url, {
        method: 'POST',
        body: formData
    })
}