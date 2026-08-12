from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from io import BytesIO
from docx import Document
import fitz
import csv
import re


app = FastAPI(
    title="WordCounter Pro",
    version="1.0"
)


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


MAX_FILE_SIZE = 20 * 1024 * 1024

SUPPORTED_FILES = {
    ".pdf",
    ".docx",
    ".txt",
    ".csv"
}


# ---------------------------------------------------------
# WORD ANALYSIS ENGINE
# ---------------------------------------------------------

def analyze_text(text: str):

    # Normalize line endings
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Unicode-aware word detection
    words = re.findall(
        r"[^\W_]+(?:['’\-][^\W_]+)*",
        text,
        flags=re.UNICODE
    )

    # Paragraph detection
    paragraphs = []

    if text.strip():
        paragraphs = [
            p.strip()
            for p in re.split(r"\n\s*\n+", text)
            if p.strip()
        ]

    # Sentence detection
    sentences = re.findall(
        r"[.!?。！？]+",
        text
    )

    # Lines
    lines = text.splitlines()

    # Characters
    characters = len(text)

    # Characters without spaces
    characters_without_spaces = len(
        re.sub(r"\s", "", text)
    )

    # Word count
    word_count = len(words)

    # Reading time
    reading_time = (
        max(1, round(word_count / 200))
        if word_count > 0
        else 0
    )

    # Speaking time
    speaking_time = (
        max(1, round(word_count / 130))
        if word_count > 0
        else 0
    )

    # Average word length
    if word_count > 0:

        total_length = sum(
            len(
                re.sub(
                    r"[^\w]",
                    "",
                    word,
                    flags=re.UNICODE
                )
            )
            for word in words
        )

        average_word_length = round(
            total_length / word_count,
            2
        )

    else:
        average_word_length = 0

    # Unique words
    unique_words = set(
        word.casefold()
        for word in words
    )

    # Word frequency
    frequency = {}

    for word in words:

        clean_word = word.casefold()

        frequency[clean_word] = (
            frequency.get(clean_word, 0) + 1
        )

    # Top 10 words
    top_words = sorted(
        frequency.items(),
        key=lambda x: (-x[1], x[0])
    )[:10]

    # Longest word
    longest_word = ""

    if words:
        longest_word = max(
            words,
            key=len
        )

    return {

        "words": word_count,

        "characters": characters,

        "characters_no_spaces":
            characters_without_spaces,

        "paragraphs":
            len(paragraphs),

        "sentences":
            len(sentences),

        "lines":
            len(lines),

        "unique_words":
            len(unique_words),

        "reading_minutes":
            reading_time,

        "speaking_minutes":
            speaking_time,

        "average_word_length":
            average_word_length,

        "longest_word":
            longest_word,

        "top_words": [
            {
                "word": word,
                "count": count
            }
            for word, count in top_words
        ],

        "text": text
    }


# ---------------------------------------------------------
# PDF
# ---------------------------------------------------------

def extract_pdf(data):

    document = fitz.open(
        stream=data,
        filetype="pdf"
    )

    pages = []

    for page in document:

        page_text = page.get_text("text")

        pages.append(page_text)

    document.close()

    return "\n\n".join(pages), len(pages)


# ---------------------------------------------------------
# DOCX
# ---------------------------------------------------------

def extract_docx(data):

    document = Document(
        BytesIO(data)
    )

    content = []

    # Paragraphs
    for paragraph in document.paragraphs:

        if paragraph.text.strip():

            content.append(
                paragraph.text
            )

    # Tables
    for table in document.tables:

        for row in table.rows:

            row_text = []

            for cell in row.cells:

                row_text.append(
                    cell.text
                )

            content.append(
                " ".join(row_text)
            )

    return "\n".join(content), None


# ---------------------------------------------------------
# TXT
# ---------------------------------------------------------

def extract_txt(data):

    return data.decode(
        "utf-8-sig",
        errors="replace"
    ), None


# ---------------------------------------------------------
# CSV
# ---------------------------------------------------------

def extract_csv(data):

    decoded = data.decode(
        "utf-8-sig",
        errors="replace"
    )

    rows = csv.reader(
        decoded.splitlines()
    )

    text = []

    for row in rows:

        text.append(
            " ".join(row)
        )

    return "\n".join(text), None


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

@app.get("/api/health")
def health():

    return {
        "status": "online",
        "service": "WordCounter Pro"
    }


# ---------------------------------------------------------
# FILE ANALYSIS
# ---------------------------------------------------------

@app.post("/api/analyze-file")
async def analyze_file(
    file: UploadFile = File(...)
):

    filename = file.filename or "document"

    extension = Path(
        filename
    ).suffix.lower()

    # Check extension
    if extension not in SUPPORTED_FILES:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Supported: PDF, DOCX, TXT, CSV"
            )
        )

    data = await file.read()

    # Check file size
    if len(data) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=413,
            detail="File exceeds the 20 MB limit."
        )

    try:

        pages = None

        # PDF
        if extension == ".pdf":

            text, pages = extract_pdf(data)

        # DOCX
        elif extension == ".docx":

            text, pages = extract_docx(data)

        # TXT
        elif extension == ".txt":

            text, pages = extract_txt(data)

        # CSV
        elif extension == ".csv":

            text, pages = extract_csv(data)

        else:

            text = ""

        result = analyze_text(text)

        result["filename"] = filename

        result["file_type"] = extension.upper().replace(
            ".",
            ""
        )

        result["file_size"] = len(data)

        result["pages"] = pages

        # Detect scanned PDF
        if (
            extension == ".pdf"
            and not text.strip()
        ):

            result["ocr_required"] = True

        else:

            result["ocr_required"] = False

        return result

    except Exception as error:

        raise HTTPException(
            status_code=422,
            detail=f"Could not process file: {error}"
        )