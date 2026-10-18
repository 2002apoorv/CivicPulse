import re
import string
from typing import List

URL_PATTERN = re.compile(r'https?://\S+|www\.\S+')
HTML_PATTERN = re.compile(r'<.*?>')
PHONE_PATTERN = re.compile(r'\b(?:\+91[\-\s]?)?[6-9]\d{9}\b')
MULTIPLE_WHITESPACE = re.compile(r'\s+')

# Common domain-agnostic English stopwords
STOPWORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're",
    "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he',
    'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it',
    "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'this', 'that', "that'll", 'these', 'those',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and',
    'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
    'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in',
    'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
}

def clean_text(text: str) -> str:
    """Sanitize and normalize raw complaint text."""
    if not text:
        return ""
    # Strip HTML tags
    text = HTML_PATTERN.sub(' ', text)
    # Strip URLs
    text = URL_PATTERN.sub(' ', text)
    # Mask phone numbers for citizen privacy
    text = PHONE_PATTERN.sub('[PHONE]', text)
    # Normalize whitespaces
    text = MULTIPLE_WHITESPACE.sub(' ', text).strip()
    return text

def preprocess_for_classification(text: str, remove_stopwords: bool = False) -> str:
    """Preprocess text for TF-IDF / NLP classification baseline."""
    cleaned = clean_text(text).lower()
    # Remove punctuation
    translator = str.maketrans('', '', string.punctuation)
    tokens = cleaned.translate(translator).split()
    if remove_stopwords:
        tokens = [t for t in tokens if t not in STOPWORDS and len(t) > 1]
    return " ".join(tokens)
