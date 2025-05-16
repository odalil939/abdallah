from llama_cpp import Llama
from llama_cpp.llama_chat_format import Llava15ChatHandler
import base64
from utils import load_config
import logging

config = load_config()

def convert_bytes_to_base64(image_bytes):
    encoded_string = base64.b64encode(image_bytes).decode("utf-8")
    return "data:image/jpeg;base64," + encoded_string

def load_llava():
    logging.info("Loading Llava model...")
    try:
        chat_handler = Llava15ChatHandler(clip_model_path=config["llava_model"]["clip_model_path"])
        logging.info("Llava15ChatHandler loaded successfully")
        llm = Llama(
            model_path=config["llava_model"]["llava_model_path"],
            chat_handler=chat_handler,
            logits_all=True,
            n_ctx=1024  # n_ctx should be increased to accommodate the image embedding
        )
        logging.info("Llama model loaded successfully")
        return llm
    except AttributeError as e:
        logging.error(f"AttributeError in loading Llava model: {e}")
        return None
    except Exception as e:
        logging.error(f"Error loading Llava model: {e}")
        raise

def handle_image(image_bytes, user_message):
    try:
        llava = load_llava()
        if not llava:
            return "Error loading Llava model"
        
        image_base64 = convert_bytes_to_base64(image_bytes)
        output = llava.create_chat_completion(
            messages=[
                {"role": "system", "content": "You are an assistant who perfectly describes images."},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": image_base64}},
                        {"type": "text", "text": user_message}
                    ]
                }
            ]
        )
        logging.info("Image processed successfully")
        return output["choices"][0]["message"]["content"]
    except Exception as e:
        logging.error(f"Error handling image: {e}")
        return "Error processing image"
