"use strict";

/*
=========================================================
WORDCOUNTER PRO
Frontend Application
=========================================================

Backend endpoint expected:

POST /api/analyze-file

The frontend and backend are served from the same domain,
so we use relative API URLs.

Supported files:
PDF
DOCX
TXT
CSV

Maximum file size:
20 MB
=========================================================
*/


/* ======================================================
   CONFIGURATION
====================================================== */

const CONFIG = {
    API_ENDPOINT: "/api/analyze-file",
    MAX_FILE_SIZE: 20 * 1024 * 1024,

    SUPPORTED_EXTENSIONS: [
        ".pdf",
        ".docx",
        ".txt",
        ".csv"
    ],

    READING_WPM: 200,
    SPEAKING_WPM: 130,

    LIVE_ANALYSIS_DELAY: 120
};


/* ======================================================
   DOM ELEMENTS
====================================================== */

const textInput = document.getElementById("textInput");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

const clearButton = document.getElementById("clearButton");
const copyTextButton = document.getElementById("copyTextButton");

const copyResultsButton = document.getElementById("copyResults");
const downloadResultsButton = document.getElementById("downloadResults");

const themeButton = document.getElementById("themeButton");
const uploadStatus = document.getElementById("uploadStatus");


/* ======================================================
   STATISTICS ELEMENTS
====================================================== */

const wordsElement = document.getElementById("words");
const charactersElement = document.getElementById("characters");
const charactersNoSpacesElement =
    document.getElementById("charactersNoSpaces");

const paragraphsElement =
    document.getElementById("paragraphs");

const sentencesElement =
    document.getElementById("sentences");

const linesElement =
    document.getElementById("lines");

const uniqueWordsElement =
    document.getElementById("uniqueWords");

const readingTimeElement =
    document.getElementById("readingTime");

const speakingTimeElement =
    document.getElementById("speakingTime");

const averageWordElement =
    document.getElementById("averageWord");

const longestWordElement =
    document.getElementById("longestWord");

const topWordsElement =
    document.getElementById("topWords");


/* ======================================================
   STATE
====================================================== */

let currentAnalysis = null;

let analysisTimer = null;

let isUploading = false;


/* ======================================================
   INITIALIZATION
====================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeTheme();

    initializeEditor();

    initializeFileUpload();

    initializeButtons();

    updateStatistics(analyzeText(textInput.value));

});


/* ======================================================
   EDITOR
====================================================== */

function initializeEditor() {

    if (!textInput) {
        return;
    }

    textInput.addEventListener("input", () => {

        clearTimeout(analysisTimer);

        analysisTimer = setTimeout(() => {

            const result = analyzeText(textInput.value);

            updateStatistics(result);

        }, CONFIG.LIVE_ANALYSIS_DELAY);

    });

}


/* ======================================================
   LOCAL TEXT ANALYSIS
====================================================== */

function analyzeText(text) {

    if (typeof text !== "string") {
        text = "";
    }

    /*
    Normalize line endings.
    */

    text = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");


    /*
    Unicode-aware word detection.

    Supports:
    English
    accented words
    apostrophes
    hyphenated words
    Unicode letters/numbers
    */

    const words = text.match(
        /[^\W_]+(?:['’\-][^\W_]+)*/gu
    ) || [];


    /*
    Character count.
    */

    const characters = text.length;


    /*
    Characters excluding whitespace.
    */

    const charactersNoSpaces =
        text.replace(/\s/g, "").length;


    /*
    Paragraph count.

    A paragraph is separated by one or more blank lines.
    */

    const trimmedText = text.trim();

    let paragraphs = 0;

    if (trimmedText.length > 0) {

        paragraphs = trimmedText
            .split(/\n\s*\n+/)
            .filter(paragraph => paragraph.trim().length > 0)
            .length;

    }


    /*
    Sentence detection.

    Handles:
    .
    !
    ?
    Unicode equivalents.
    */

    let sentences = 0;

    if (trimmedText.length > 0) {

        const sentenceMatches =
            trimmedText.match(
                /[^.!?。！？]*[.!?。！？]+(?=\s|$)/gu
            );

        sentences = sentenceMatches
            ? sentenceMatches.length
            : 1;
    }


    /*
    Lines.
    */

    let lines = 0;

    if (text.length > 0) {

        lines = text.split("\n").length;

    }


    /*
    Unique words.
    */

    const frequency = new Map();

    for (const word of words) {

        const normalizedWord =
            word.toLocaleLowerCase();

        frequency.set(
            normalizedWord,
            (frequency.get(normalizedWord) || 0) + 1
        );

    }


    /*
    Average word length.
    */

    let averageWordLength = 0;

    if (words.length > 0) {

        let totalLength = 0;

        for (const word of words) {

            totalLength += word
                .replace(/[^\p{L}\p{N}]/gu, "")
                .length;

        }

        averageWordLength =
            totalLength / words.length;

    }


    /*
    Longest word.
    */

    let longestWord = "";

    if (words.length > 0) {

        longestWord = words.reduce(
            (longest, current) => {

                const longestClean =
                    longest.replace(
                        /[^\p{L}\p{N}]/gu,
                        ""
                    );

                const currentClean =
                    current.replace(
                        /[^\p{L}\p{N}]/gu,
                        ""
                    );

                return currentClean.length >
                    longestClean.length
                    ? current
                    : longest;

            }
        );

    }


    /*
    Top 10 words.
    */

    const topWords = Array.from(
        frequency.entries()
    )
        .sort((a, b) => {

            if (b[1] !== a[1]) {
                return b[1] - a[1];
            }

            return a[0].localeCompare(b[0]);

        })
        .slice(0, 10)
        .map(([word, count]) => ({
            word,
            count
        }));


    /*
    Reading time.

    We display seconds for very short text and
    minutes for longer text.
    */

    const readingSeconds =
        words.length > 0
            ? Math.ceil(
                (words.length / CONFIG.READING_WPM) * 60
            )
            : 0;


    /*
    Speaking time.
    */

    const speakingSeconds =
        words.length > 0
            ? Math.ceil(
                (words.length / CONFIG.SPEAKING_WPM) * 60
            )
            : 0;


    return {

        text,

        words: words.length,

        characters,

        characters_no_spaces:
            charactersNoSpaces,

        paragraphs,

        sentences,

        lines,

        unique_words:
            frequency.size,

        reading_seconds:
            readingSeconds,

        speaking_seconds:
            speakingSeconds,

        reading_minutes:
            words.length > 0
                ? Math.ceil(
                    words.length /
                    CONFIG.READING_WPM
                )
                : 0,

        speaking_minutes:
            words.length > 0
                ? Math.ceil(
                    words.length /
                    CONFIG.SPEAKING_WPM
                )
                : 0,

        average_word_length:
            Number(
                averageWordLength.toFixed(2)
            ),

        longest_word:
            longestWord,

        top_words:
            topWords
    };

}


/* ======================================================
   UPDATE STATISTICS UI
====================================================== */

function updateStatistics(result) {

    if (!result) {
        return;
    }

    currentAnalysis = result;


    setText(
        wordsElement,
        formatNumber(result.words)
    );

    setText(
        charactersElement,
        formatNumber(result.characters)
    );

    setText(
        charactersNoSpacesElement,
        formatNumber(result.characters_no_spaces)
    );

    setText(
        paragraphsElement,
        formatNumber(result.paragraphs)
    );

    setText(
        sentencesElement,
        formatNumber(result.sentences)
    );

    setText(
        linesElement,
        formatNumber(result.lines)
    );

    setText(
        uniqueWordsElement,
        formatNumber(result.unique_words)
    );


    /*
    Reading time.
    */

    setText(
        readingTimeElement,
        formatDuration(
            result.reading_seconds
        )
    );


    /*
    Speaking time.
    */

    setText(
        speakingTimeElement,
        formatDuration(
            result.speaking_seconds
        )
    );


    /*
    Average word length.
    */

    setText(
        averageWordElement,
        result.average_word_length
            ? result.average_word_length.toFixed(2)
            : "0"
    );


    /*
    Longest word.
    */

    setText(
        longestWordElement,
        result.longest_word || "—"
    );


    /*
    Most used words.
    */

    renderTopWords(
        result.top_words
    );

}


/* ======================================================
   TOP WORDS
====================================================== */

function renderTopWords(topWords) {

    if (!topWordsElement) {
        return;
    }

    topWordsElement.innerHTML = "";


    if (!topWords || topWords.length === 0) {

        const empty = document.createElement("span");

        empty.className = "empty";

        empty.textContent =
            "Start typing to see word frequency.";

        topWordsElement.appendChild(empty);

        return;
    }


    for (const item of topWords) {

        const element =
            document.createElement("span");

        element.className = "word-frequency";


        const word =
            document.createElement("strong");

        word.textContent = item.word;


        const count =
            document.createElement("small");

        count.textContent =
            String(item.count);


        element.appendChild(word);

        element.appendChild(count);

        topWordsElement.appendChild(element);

    }

}


/* ======================================================
   FILE UPLOAD INITIALIZATION
====================================================== */

function initializeFileUpload() {

    if (!fileInput || !dropZone) {
        return;
    }


    /*
    Normal file selection.
    */

    fileInput.addEventListener(
        "change",
        async event => {

            const files =
                event.target.files;

            if (!files || files.length === 0) {
                return;
            }

            await processFile(files[0]);

            /*
            Allow selecting the same file again.
            */

            fileInput.value = "";

        }
    );


    /*
    Drag over.
    */

    dropZone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            dropZone.classList.add(
                "drag-over"
            );

        }
    );


    /*
    Drag leave.
    */

    dropZone.addEventListener(
        "dragleave",
        event => {

            event.preventDefault();

            dropZone.classList.remove(
                "drag-over"
            );

        }
    );


    /*
    Drop.
    */

    dropZone.addEventListener(
        "drop",
        async event => {

            event.preventDefault();

            dropZone.classList.remove(
                "drag-over"
            );


            const files =
                event.dataTransfer.files;

            if (!files || files.length === 0) {
                return;
            }

            await processFile(files[0]);

        }
    );

}


/* ======================================================
   PROCESS UPLOADED FILE
====================================================== */

async function processFile(file) {

    if (isUploading) {
        return;
    }


    /*
    Validate file.
    */

    const validation =
        validateFile(file);

    if (!validation.valid) {

        showUploadStatus(
            validation.message,
            "error"
        );

        return;
    }


    isUploading = true;


    showUploadStatus(
        `Analyzing ${file.name}...`,
        "loading"
    );


    try {

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );


        const response =
            await fetch(
                CONFIG.API_ENDPOINT,
                {
                    method: "POST",
                    body: formData
                }
            );


        /*
        Read response safely.
        */

        let data = null;

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data = await response.json();

        } else {

            const text =
                await response.text();

            throw new Error(
                text ||
                `Server returned HTTP ${response.status}`
            );

        }


        /*
        Handle HTTP errors.
        */

        if (!response.ok) {

            throw new Error(
                data?.detail ||
                `Upload failed (${response.status})`
            );

        }


        /*
        Put extracted text into editor.
        */

        if (
            typeof data.text === "string" &&
            textInput
        ) {

            textInput.value =
                data.text;

        }


        /*
        Update statistics.

        The backend is considered the authoritative
        result for uploaded documents.
        */

        updateStatistics(
            normalizeBackendResult(data)
        );


        /*
        Display success information.
        */

        let message =
            `${file.name} analyzed successfully`;

        if (data.pages) {

            message +=
                ` · ${data.pages} page` +
                `${data.pages === 1 ? "" : "s"}`;

        }


        showUploadStatus(
            message,
            "success"
        );


        /*
        Warn when backend reports OCR requirement.
        */

        if (data.ocr_required) {

            showUploadStatus(
                `${file.name} contains no selectable text. OCR is required for scanned/image-only PDFs.`,
                "warning"
            );

        }


    } catch (error) {

        console.error(
            "File analysis error:",
            error
        );


        showUploadStatus(
            getFriendlyError(error),
            "error"
        );

    } finally {

        isUploading = false;

    }

}


/* ======================================================
   VALIDATE FILE
====================================================== */

function validateFile(file) {

    if (!file) {

        return {
            valid: false,
            message: "No file selected."
        };

    }


    /*
    File size.
    */

    if (
        file.size >
        CONFIG.MAX_FILE_SIZE
    ) {

        return {
            valid: false,
            message:
                "File is larger than 20 MB."
        };

    }


    /*
    Extension.
    */

    const filename =
        file.name.toLowerCase();

    const extension =
        filename.includes(".")
            ? filename.slice(
                filename.lastIndexOf(".")
            )
            : "";


    if (
        !CONFIG.SUPPORTED_EXTENSIONS.includes(
            extension
        )
    ) {

        return {
            valid: false,
            message:
                "Unsupported file type. Please upload PDF, DOCX, TXT or CSV."
        };

    }


    return {
        valid: true,
        message: ""
    };

}


/* ======================================================
   NORMALIZE BACKEND RESULT
====================================================== */

function normalizeBackendResult(data) {

    return {

        text:
            typeof data.text === "string"
                ? data.text
                : "",

        words:
            toNumber(data.words),

        characters:
            toNumber(data.characters),

        characters_no_spaces:
            toNumber(
                data.characters_no_spaces
            ),

        paragraphs:
            toNumber(data.paragraphs),

        sentences:
            toNumber(data.sentences),

        lines:
            toNumber(data.lines),

        unique_words:
            toNumber(data.unique_words),

        reading_seconds:
            data.reading_seconds != null
                ? toNumber(
                    data.reading_seconds
                )
                : toNumber(
                    data.reading_minutes
                ) * 60,

        speaking_seconds:
            data.speaking_seconds != null
                ? toNumber(
                    data.speaking_seconds
                )
                : toNumber(
                    data.speaking_minutes
                ) * 60,

        reading_minutes:
            toNumber(
                data.reading_minutes
            ),

        speaking_minutes:
            toNumber(
                data.speaking_minutes
            ),

        average_word_length:
            toNumber(
                data.average_word_length
            ),

        longest_word:
            data.longest_word || "",

        top_words:
            Array.isArray(data.top_words)
                ? data.top_words
                : []

    };

}


/* ======================================================
   BUTTONS
====================================================== */

function initializeButtons() {


    /*
    Clear.
    */

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearEditor
        );

    }


    /*
    Copy editor text.
    */

    if (copyTextButton) {

        copyTextButton.addEventListener(
            "click",
            copyEditorText
        );

    }


    /*
    Copy results.
    */

    if (copyResultsButton) {

        copyResultsButton.addEventListener(
            "click",
            copyResults
        );

    }


    /*
    Download report.
    */

    if (downloadResultsButton) {

        downloadResultsButton.addEventListener(
            "click",
            downloadReport
        );

    }


    /*
    Theme.
    */

    if (themeButton) {

        themeButton.addEventListener(
            "click",
            toggleTheme
        );

    }

}


/* ======================================================
   CLEAR EDITOR
====================================================== */

function clearEditor() {

    if (textInput) {
        textInput.value = "";
    }


    const result =
        analyzeText("");

    updateStatistics(result);


    showUploadStatus(
        "Editor cleared.",
        "success"
    );

}


/* ======================================================
   COPY EDITOR TEXT
====================================================== */

async function copyEditorText() {

    if (!textInput) {
        return;
    }

    const text =
        textInput.value;


    if (!text) {

        showUploadStatus(
            "There is no text to copy.",
            "warning"
        );

        return;
    }


    const success =
        await copyToClipboard(text);


    if (success) {

        showUploadStatus(
            "Text copied to clipboard.",
            "success"
        );

    } else {

        showUploadStatus(
            "Could not copy the text.",
            "error"
        );

    }

}


/* ======================================================
   COPY RESULTS
====================================================== */

async function copyResults() {

    const result =
        currentAnalysis ||
        analyzeText(
            textInput
                ? textInput.value
                : ""
        );


    const report =
        createReportText(result);


    const success =
        await copyToClipboard(report);


    if (success) {

        showUploadStatus(
            "Analysis results copied.",
            "success"
        );

    } else {

        showUploadStatus(
            "Could not copy the results.",
            "error"
        );

    }

}


/* ======================================================
   DOWNLOAD REPORT
====================================================== */

function downloadReport() {

    const result =
        currentAnalysis ||
        analyzeText(
            textInput
                ? textInput.value
                : ""
        );


    const report =
        createReportText(result);


    const blob =
        new Blob(
            [report],
            {
                type: "text/plain;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "wordcounter-pro-report.txt";


    document.body.appendChild(link);

    link.click();

    link.remove();


    /*
    Release object URL.
    */

    setTimeout(() => {

        URL.revokeObjectURL(url);

    }, 100);


    showUploadStatus(
        "Report downloaded.",
        "success"
    );

}


/* ======================================================
   REPORT GENERATOR
====================================================== */

function createReportText(result) {

    const topWords =
        result.top_words || [];


    let topWordsText =
        "None";


    if (topWords.length > 0) {

        topWordsText =
            topWords
                .map(
                    item =>
                        `${item.word}: ${item.count}`
                )
                .join("\n");

    }


    return `WORDCOUNTER PRO
==================

Word Count Results

Words: ${result.words}
Characters: ${result.characters}
Characters Without Spaces: ${result.characters_no_spaces}
Paragraphs: ${result.paragraphs}
Sentences: ${result.sentences}
Lines: ${result.lines}
Unique Words: ${result.unique_words}

Reading Time: ${formatDuration(result.reading_seconds)}
Speaking Time: ${formatDuration(result.speaking_seconds)}

Average Word Length: ${result.average_word_length || 0}
Longest Word: ${result.longest_word || "—"}

Most Used Words:
${topWordsText}

Generated by WordCounter Pro
`;

}


/* ======================================================
   THEME
====================================================== */

function initializeTheme() {

    const savedTheme =
        localStorage.getItem(
            "wordcounter-theme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

        updateThemeButton(true);

        return;

    }


    if (
        savedTheme === "light"
    ) {

        document.body.classList.remove(
            "dark-mode"
        );

        updateThemeButton(false);

        return;

    }


    /*
    Follow system preference.
    */

    const prefersDark =
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;


    if (prefersDark) {

        document.body.classList.add(
            "dark-mode"
        );

    }


    updateThemeButton(
        prefersDark
    );

}


/* ======================================================
   TOGGLE THEME
====================================================== */

function toggleTheme() {

    const isDark =
        document.body.classList.toggle(
            "dark-mode"
        );


    localStorage.setItem(
        "wordcounter-theme",
        isDark
            ? "dark"
            : "light"
    );


    updateThemeButton(
        isDark
    );

}


/* ======================================================
   THEME BUTTON
====================================================== */

function updateThemeButton(isDark) {

    if (!themeButton) {
        return;
    }


    themeButton.textContent =
        isDark
            ? "☀️"
            : "🌙";


    themeButton.setAttribute(
        "aria-label",
        isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
    );

}


/* ======================================================
   UPLOAD STATUS
====================================================== */

function showUploadStatus(
    message,
    type = "info"
) {

    if (!uploadStatus) {
        return;
    }


    uploadStatus.textContent =
        message;


    uploadStatus.className =
        `upload-status ${type}`;

}


/* ======================================================
   FRIENDLY ERROR
====================================================== */

function getFriendlyError(error) {

    if (!error) {
        return "Something went wrong.";
    }


    if (
        error instanceof TypeError
    ) {

        return (
            "Unable to connect to the WordCounter server. " +
            "Please check that the backend is running."
        );

    }


    return error.message ||
        "Unable to analyze the file.";

}


/* ======================================================
   CLIPBOARD
====================================================== */

async function copyToClipboard(text) {

    if (!text) {
        return false;
    }


    /*
    Modern Clipboard API.
    */

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                text
            );

            return true;

        }

    } catch (error) {

        console.warn(
            "Clipboard API failed:",
            error
        );

    }


    /*
    Fallback for older browsers.
    */

    try {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value = text;

        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";

        document.body.appendChild(
            textarea
        );

        textarea.focus();

        textarea.select();


        const successful =
            document.execCommand(
                "copy"
            );


        textarea.remove();

        return successful;

    } catch (error) {

        console.error(
            "Clipboard fallback failed:",
            error
        );

        return false;

    }

}


/* ======================================================
   HELPERS
====================================================== */

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }

    element.textContent =
        value;

}


function toNumber(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


function formatNumber(value) {

    return Number(value || 0)
        .toLocaleString();

}


/* ======================================================
   FORMAT TIME
====================================================== */

function formatDuration(seconds) {

    seconds =
        Math.max(
            0,
            Math.round(
                Number(seconds) || 0
            )
        );


    if (seconds === 0) {
        return "0 min";
    }


    const hours =
        Math.floor(
            seconds / 3600
        );


    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );


    const remainingSeconds =
        seconds % 60;


    if (hours > 0) {

        if (minutes > 0) {

            return `${hours} hr ${minutes} min`;

        }

        return `${hours} hr`;

    }


    if (minutes > 0) {

        if (remainingSeconds > 0) {

            return `${minutes} min ${remainingSeconds} sec`;

        }

        return `${minutes} min`;

    }


    return `${remainingSeconds} sec`;

}


/* ======================================================
   KEYBOARD SHORTCUTS
====================================================== */

document.addEventListener(
    "keydown",
    event => {

        /*
        Ctrl + Shift + C
        Clear editor
        */

        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key.toLowerCase() === "c"
        ) {

            event.preventDefault();

            clearEditor();

        }


        /*
        Ctrl + Shift + S
        Download report
        */

        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key.toLowerCase() === "s"
        ) {

            event.preventDefault();

            downloadReport();

        }

    }
);


/* ======================================================
   PREVENT ACCIDENTAL FILE DROP ON PAGE
====================================================== */

window.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

    }
);


window.addEventListener(
    "drop",
    event => {

        /*
        Only the dropZone should handle files.
        */

        if (
            !dropZone ||
            !dropZone.contains(event.target)
        ) {

            event.preventDefault();

        }

    }
);


/* ======================================================
   EXPORT FOR DEBUGGING
====================================================== */

window.WordCounterPro = {

    analyzeText,

    updateStatistics,

    processFile,

    clearEditor,

    downloadReport,

    copyResults

};