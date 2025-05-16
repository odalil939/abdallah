from flask import Flask, render_template, request, jsonify, session, g
from utils import get_timestamp, load_config, get_avatar
from image_handler import handle_image
from audio_handler import transcribe_audio
from pdf_handler import add_documents_to_db
from database_operations import load_last_k_text_messages, save_text_message, save_image_message, save_audio_message, load_messages, get_all_chat_history_ids, delete_chat_history
from llm_chains import load_normal_chain, load_pdf_chat_chain
import sqlite3

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Replace with your actual secret key
config = load_config()

def get_db_conn():
    if 'db_conn' not in g:
        g.db_conn = sqlite3.connect(config["chat_sessions_database_path"], check_same_thread=False)
    return g.db_conn

def load_chain():
    if session.get('pdf_chat'):
        return load_pdf_chat_chain()
    return load_normal_chain()

def get_session_key():
    if session.get('session_key') == "new_session":
        if not session.get('new_session_key'):
            session['new_session_key'] = get_timestamp()
        return session['new_session_key']
    return session.get('session_key')

@app.teardown_appcontext
def close_db_conn(error):
    if 'db_conn' in g:
        g.db_conn.close()

@app.route('/')
def index():
    if 'session_key' not in session:
        session['session_key'] = "new_session"
        session['new_session_key'] = None
        session['session_index_tracker'] = "new_session"
        session['audio_uploader_key'] = 0
        session['pdf_uploader_key'] = 1
    return render_template('index.html')

@app.route('/get_chat_sessions')
def get_chat_sessions():
    chat_sessions = ["new_session"] + get_all_chat_history_ids()
    return jsonify(chat_sessions)

@app.route('/get_chat_history')
def get_chat_history():
    session_key = request.args.get('session_key', get_session_key())
    chat_history_messages = load_messages(session_key)
    
    # Adding appropriate image paths
    for message in chat_history_messages:
        if message['sender_type'] == 'human':
            message['icon'] = 'user_image.png'
        else:
            message['icon'] = 'bot_image.png'
    
    return jsonify(chat_history_messages)

@app.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    files = request.files.getlist('pdf_files')
    if files:
        add_documents_to_db([file.read() for file in files])
        session['pdf_uploader_key'] += 2
    return jsonify({'message': 'PDFs uploaded successfully'})

@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    audio_file = request.files['audio_file']
    if audio_file:
        transcribed_audio = transcribe_audio(audio_file.read())
        llm_chain = load_chain()
        llm_answer = llm_chain.run(user_input="Summarize this text: " + transcribed_audio, chat_history=[])
        save_audio_message(get_session_key(), "human", audio_file.read())
        save_text_message(get_session_key(), "ai", llm_answer)
        session['audio_uploader_key'] += 2
    return jsonify({'message': 'Audio uploaded and processed successfully', 'llm_answer': llm_answer})

@app.route('/send_message', methods=['POST'])
def send_message():
    user_input = request.form['user_input']
    uploaded_image = request.files.get('image_file')
    session_key = get_session_key()
    
    if uploaded_image:
        llm_answer = handle_image(uploaded_image.read(), user_input)
        save_text_message(session_key, "human", user_input)
        save_image_message(session_key, "human", uploaded_image.read())
        save_text_message(session_key, "ai", llm_answer)
    else:
        llm_chain = load_chain()
        llm_answer = llm_chain.run(user_input=user_input, chat_history=load_last_k_text_messages(session_key, config["chat_config"]["chat_memory_length"]))
        save_text_message(session_key, "human", user_input)
        save_text_message(session_key, "ai", llm_answer)
        
    return jsonify({'message': 'Message sent successfully', 'llm_answer': llm_answer})

if __name__ == "__main__":
    app.run(debug=True)
