from llm_chains import load_vectordb, create_embeddings

if __name__ == "__main__":
    
    pdfs_folder_path = r"C:\Users\znabd\Desktop\chatbot\local_multimodal_ai_chat-main\pdfs"
    
    vector_db = load_vectordb(create_embeddings())
    output = vector_db.similarity_search(pdfs_folder_path)
    print(output)