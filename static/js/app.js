document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    loadChatSessions();

    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarToggleOpen = document.getElementById('sidebar-toggle-open');
    const attachmentIcon = document.getElementById('attachment-icon');
    const attachmentOptions = document.getElementById('attachment-options');

    // تحقق من حالة الشريط الجانبي عند التحميل
    if (sidebar.classList.contains('closed')) {
        sidebarToggleOpen.style.display = 'block';
        sidebarToggle.style.display = 'none';
    } else {
        sidebarToggleOpen.style.display = 'none';
        sidebarToggle.style.display = 'block';
    }

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('closed');
        sidebarToggleOpen.style.display = 'block';
        sidebarToggle.style.display = 'none';
    });

    sidebarToggleOpen.addEventListener('click', () => {
        sidebar.classList.remove('closed');
        sidebarToggleOpen.style.display = 'none';
        sidebarToggle.style.display = 'block';
    });
    

    document.getElementById('chat-form').onsubmit = function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const sendButton = this.querySelector('button[type="submit"]');
        sendButton.disabled = true;
        sendButton.innerHTML = 'Sending...';
        
        fetch('/send_message', {
            method: 'POST',
            body: new FormData(this)
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then(data => {
            console.log('Response data:', data);
            appendMessage('', document.getElementById('user_input').value, 'user_image.png');
            appendMessage('', data.llm_answer, 'bot_image.png');
            document.getElementById('user_input').value = '';
        }).catch(error => {
            console.error('Error:', error);
        }).finally(() => {
            sendButton.disabled = false;
            sendButton.innerHTML = 'Send';
        });
    };

    // Attach event listeners to the attachment inputs
    document.querySelectorAll('.attachment-options label').forEach(label => {
        label.addEventListener('click', (e) => {
            const input = label.querySelector('input[type="file"]');
            input.click();
        });
    });

    // Submit attachment forms automatically on file selection
    document.querySelectorAll('.attachment-options input[type="file"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const form = new FormData();
            form.append(input.name, input.files[0]);

            fetch(`/upload_${input.name}`, {
                method: 'POST',
                body: form
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).then(data => {
                console.log('Response data:', data);
                alert(data.message);
            }).catch(error => {
                console.error('Error:', error);
            });
        });
    });

    attachmentIcon.addEventListener('click', () => {
        attachmentOptions.style.display = attachmentOptions.style.display === 'none' ? 'block' : 'none';
    });
});

function loadChatHistory() {
    console.log('Loading chat history');
    const session_key = sessionStorage.getItem('session_key') || 'new_session';
    fetch(`/get_chat_history?session_key=${session_key}`)
        .then(response => response.json())
        .then(data => {
            console.log('Chat history:', data);
            const chatContainer = document.getElementById('chat-container');
            chatContainer.innerHTML = '';
            data.forEach(message => {
                appendMessage(message.sender_type, message.content, message.icon);
            });
        });
}

function loadChatSessions() {
    console.log('Loading chat sessions');
    fetch('/get_chat_sessions')
        .then(response => response.json())
        .then(data => {
            console.log('Chat sessions:', data);
            const chatSessions = document.getElementById('chat-sessions');
            chatSessions.innerHTML = '<li id="create-new-chat"><button onclick="createNewChat()" class="create-chat-btn"><img src="static/img/create_icon.png" class="create-icon">Create New Chat</button></li>';
            data.reverse().forEach(session_id => {
                const sessionElement = document.createElement('li');
                sessionElement.innerText = session_id;
                sessionElement.onclick = () => {
                    sessionStorage.setItem('session_key', session_id);
                    loadChatHistory();
                };
                chatSessions.appendChild(sessionElement);
            });
        });
}

function createNewChat() {
    sessionStorage.setItem('session_key', 'new_session');
    location.reload();
}

function appendMessage(sender, content, icon) {
    const chatContainer = document.getElementById('chat-container');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.innerHTML = `<img src="static/img/${icon}" class="message-icon"> <strong>${sender}:</strong> ${content}`;
    chatContainer.appendChild(messageElement);
    console.log(`Appended message from ${sender}: ${content}`);
}

document.getElementById('send-button').onclick = function(e) {
    e.preventDefault();
    console.log('Form submitted');

    const sendButton = this;
    sendButton.disabled = true;

    fetch('/send_message', {
        method: 'POST',
        body: new FormData(document.getElementById('chat-form'))
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        console.log('Response data:', data);
        appendMessage('', document.getElementById('user_input').value, 'user_image.png');
        appendMessage('', data.llm_answer, 'bot_image.png');
        document.getElementById('user_input').value = '';
    }).catch(error => {
        console.error('Error:', error);
    }).finally(() => {
        sendButton.disabled = false;
    });
};

document.addEventListener('DOMContentLoaded', function() {
    const botIcon = document.querySelector('.bot-icon');
    const botChatBox = document.getElementById('bot-chat-box');
    const botMessageElement = document.getElementById('bot-message');
    const message = "Welcome! Ask me anything, I'm here to help you. Best regards, AgriBot 🎧🎙️";
    let index = 0;

    function typeMessage() {
        if (index < message.length) {
            botMessageElement.innerHTML += message.charAt(index);
            index++;
            setTimeout(typeMessage, 50); // تأخير بين كل حرف وحرف
        }
    }

    // عرض صندوق الحوار وبدء كتابة الرسالة عند تحميل الصفحة
    botChatBox.style.display = 'block';
    typeMessage();

    // إضافة حدث النقر لإغلاق صندوق الحوار
    botIcon.addEventListener('click', function() {
        botChatBox.style.display = 'none';
    });
});