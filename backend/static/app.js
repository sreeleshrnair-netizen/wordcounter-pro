// ============================================================
// WordCounter Pro - Complete Frontend JavaScript
// ============================================================

const API_BASE = window.location.origin;

// ============================================================
// DOM ELEMENTS
// ============================================================

const textInput = document.getElementById("textInput");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const uploadStatus = document.getElementById("uploadStatus");

const themeButton = document.getElementById("themeButton");
const clearButton = document.getElementById("clearButton");
const copyTextButton = document.getElementById("copyTextButton");

const copyResultsButton = document.getElementById("copyResults");
const downloadResultsButton = document.getElementById("downloadResults");

// Statistics
const wordsElement = document.getElementById("words");
const charactersElement = document.getElementById("characters");
const charactersNoSpacesElement =
    document.getElementById("charactersNoSpaces");
const paragraphsElement = document.getElementById("paragraphs");
const sentencesElement = document.getElementById("sentences");
const linesElement = document.getElementById("lines");
const uniqueWordsElement = document.getElementById("uniqueWords");
const readingTimeElement = document.getElementById("readingTime");
const speakingTimeElement = document.getElementById("speakingTime");

const averageWordElement = document.getElementById("averageWord");
const longestWordElement = document.getElementById("longestWord");
const topWordsElement = document.getElementById("topWords");

// ============================================================
// CURRENT DATA
// ============================================================

let currentAnalysis = {
    words: 0,
    characters: 0,
    characters_no_spaces: 0,
    paragraphs: 0,
    sentences: 0,
    lines: 0,
    unique_words: 0,
    reading_minutes: 0,
    speaking_minutes: 0,
    average_word_length: 0,
    longest_word: "",
    top_words: [],
    text: ""
};

// ============================================================
// THEME
// ============================================================

function applyTheme(theme) {
    const isLight = theme === "light";

    // Main theme attributes
    document.documentElement.setAttribute(
        "data-theme",
        isLight ? "light" : "dark"
    );

    document.body.classList.toggle("light-mode", isLight);
    document.body.classList.toggle("dark-mode", !isLight);

    // Button icon
    if (themeButton) {
        themeButton.textContent = isLight ? "☀️" : "🌙";
        themeButton.setAttribute(
            "aria-label",
            isLight ? "Switch to dark mode" : "Switch to light mode"
        );
        themeButton.setAttribute(
            "title",
            isLight ? "Switch to dark mode" : "Switch to light mode"
        );
    }

    // Save preference
    localStorage.setItem("wordcounter-theme", theme);

    // Apply guaranteed theme variables
    if (isLight) {
        document.documentElement.style.setProperty(
            "--theme-bg",
            "#f5f7fb"
        );
        document.documentElement.style.setProperty(
            "--theme-card",
            "#ffffff"
        );
        document.documentElement.style.setProperty(
            "--theme-text",
            "#111827"
        );
        document.documentElement.style.setProperty(
            "--theme-muted",
            "#64748b"
        );
        document.documentElement.style.setProperty(
            "--theme-border",
            "#dbe2ea"
        );
        document.documentElement.style.setProperty(
            "--theme-input",
            "#ffffff"
        );
    } else {
        document.documentElement.style.setProperty(
            "--theme-bg",
            "#0b0d10"
        );
        document.documentElement.style.setProperty(
            "--theme-card",
            "#11151a"
        );
        document.documentElement.style.setProperty(
            "--theme-text",
            "#f5f7fa"
        );
        document.documentElement.style.setProperty(
            "--theme-muted",
            "#9ca3af"
        );
        document.documentElement.style.setProperty(
            "--theme-border",
            "#29313a"
        );
        document.documentElement.style.setProperty(
            "--theme-input",
            "#0f1318"
        );
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem("wordcounter-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
        applyTheme(savedTheme);
        return;
    }

    // Default = dark mode
    applyTheme("dark");
}

if (themeButton) {
    themeButton.addEventListener("click", function () {
        const currentTheme =
            document.documentElement.getAttribute("data-theme") ||
            "dark";

        const newTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";

        applyTheme(newTheme);
    });
}

initializeTheme();

// ============================================================
// LIVE THEME CSS
// This guarantees the button works even if the existing CSS
// doesn't contain light-mode styles.
// ============================================================

const themeStyle = document.createElement("style");

themeStyle.textContent = `
    html,
    body {
        transition:
            background-color 0.25s ease,
            color 0.25s ease;
    }

    body {
        background-color: var(--theme-bg);
        color: var(--theme-text);
    }

    body.light-mode {
        background-color: var(--theme-bg) !important;
        color: var(--theme-text) !important;
    }

    body.light-mode .navbar,
    body.light-mode .main-card,
    body.light-mode .stat-card,
    body.light-mode .advanced-card,
    body.light-mode .editor,
    body.light-mode .upload-area {
        background-color: var(--theme-card);
        color: var(--theme-text);
        border-color: var(--theme-border);
    }

    body.light-mode textarea {
        background-color: var(--theme-input);
        color: var(--theme-text);
        border-color: var(--theme-border);
    }

    body.light-mode textarea::placeholder {
        color: #94a3b8;
    }

    body.light-mode .editor-header,
    body.light-mode .editor-footer {
        color: var(--theme-muted);
    }

    body.light-mode footer,
    body.light-mode .hero p,
    body.light-mode .stat-card span,
    body.light-mode .analysis-row span {
        color: var(--theme-muted);
    }

    body.light-mode .or span {
        background-color: var(--theme-bg);
        color: var(--theme-muted);
    }

    body.light-mode .or {
        border-color: var(--theme-border);
    }

    body.light-mode .theme-button,
    body.light-mode .small-button,
    body.light-mode .secondary-button {
        color: var(--theme-text);
    }

    body.light-mode .top-words .empty {
        color: var(--theme-muted);
    }
`;

document.head.appendChild(themeStyle);

// ============================================================
// ANALYZE TEXT LOCALLY
// ============================================================

function analyzeText(text) {

    if (!text) {
        return {
            words: 0,
            characters: 0,
            characters_no_spaces: 0,
            paragraphs: 0,
            sentences: 0,
            lines: 0,
            unique_words: 0,
            reading_minutes: 0,
            speaking_minutes: 0,
            average_word_length: 0,
            longest_word: "",
            top_words: [],
            text: ""
        };
    }

    const normalizedText = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");

    // Unicode-aware word detection
    const words = normalizedText.match(
        /[^\W_]+(?:['’\-][^\W_]+)*/gu
    ) || [];

    // Paragraphs
    const paragraphs = normalizedText
        .split(/\n\s*\n+/)
        .map(p => p.trim())
        .filter(Boolean);

    // Sentences
    const sentenceMatches = normalizedText.match(
        /[^.!?。！？]+[.!?。！？]+/g
    ) || [];

    let sentenceCount;

    if (!normalizedText.trim()) {
        sentenceCount = 0;
    } else if (sentenceMatches.length === 0) {
        sentenceCount = 1;
    } else {
        sentenceCount = sentenceMatches.length;
    }

    // Lines
    const lines = normalizedText
        .split("\n")
        .filter(line => line.trim().length > 0);

    // Characters
    const characters = normalizedText.length;

    const charactersNoSpaces =
        normalizedText.replace(/\s/g, "").length;

    // Unique words
    const normalizedWords = words.map(word =>
        word.toLocaleLowerCase()
    );

    const uniqueSet = new Set(normalizedWords);

    // Frequency
    const frequency = {};

    normalizedWords.forEach(word => {
        frequency[word] =
            (frequency[word] || 0) + 1;
    });

    const topWords = Object.entries(frequency)
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

    // Clean words for length calculations
    const cleanWords = words.map(word =>
        word.replace(/[^\p{L}\p{N}]/gu, "")
    );

    // Average word length
    let averageWordLength = 0;

    if (cleanWords.length > 0) {
        const totalLength = cleanWords.reduce(
            (total, word) =>
                total + word.length,
            0
        );

        averageWordLength =
            Math.round(
                (totalLength / cleanWords.length) * 100
            ) / 100;
    }

    // Longest word
    let longestWord = "";

    if (cleanWords.length > 0) {
        let longestIndex = 0;

        cleanWords.forEach((word, index) => {
            if (
                word.length >
                cleanWords[longestIndex].length
            ) {
                longestIndex = index;
            }
        });

        longestWord = words[longestIndex];
    }

    // Reading time
    const readingMinutes =
        words.length > 0
            ? Math.max(
                1,
                Math.round(words.length / 200)
            )
            : 0;

    // Speaking time
    const speakingMinutes =
        words.length > 0
            ? Math.max(
                1,
                Math.round(words.length / 130)
            )
            : 0;

    return {
        words: words.length,
        characters,
        characters_no_spaces: charactersNoSpaces,
        paragraphs: paragraphs.length,
        sentences: sentenceCount,
        lines: lines.length,
        unique_words: uniqueSet.size,
        reading_minutes: readingMinutes,
        speaking_minutes: speakingMinutes,
        average_word_length: averageWordLength,
        longest_word: longestWord,
        top_words: topWords,
        text: normalizedText
    };
}

// ============================================================
// UPDATE UI
// ============================================================

function updateUI(data) {

    currentAnalysis = {
        ...currentAnalysis,
        ...data
    };

    if (wordsElement) {
        wordsElement.textContent =
            data.words ?? 0;
    }

    if (charactersElement) {
        charactersElement.textContent =
            data.characters ?? 0;
    }

    if (charactersNoSpacesElement) {
        charactersNoSpacesElement.textContent =
            data.characters_no_spaces ?? 0;
    }

    if (paragraphsElement) {
        paragraphsElement.textContent =
            data.paragraphs ?? 0;
    }

    if (sentencesElement) {
        sentencesElement.textContent =
            data.sentences ?? 0;
    }

    if (linesElement) {
        linesElement.textContent =
            data.lines ?? 0;
    }

    if (uniqueWordsElement) {
        uniqueWordsElement.textContent =
            data.unique_words ?? 0;
    }

    if (readingTimeElement) {
        readingTimeElement.textContent =
            `${data.reading_minutes ?? 0} min`;
    }

    if (speakingTimeElement) {
        speakingTimeElement.textContent =
            `${data.speaking_minutes ?? 0} min`;
    }

    if (averageWordElement) {
        averageWordElement.textContent =
            data.average_word_length ?? 0;
    }

    if (longestWordElement) {
        longestWordElement.textContent =
            data.longest_word || "—";
    }

    updateTopWords(data.top_words || []);
}

// ============================================================
// TOP WORDS
// ============================================================

function updateTopWords(words) {

    if (!topWordsElement) {
        return;
    }

    topWordsElement.innerHTML = "";

    if (!words || words.length === 0) {

        const empty = document.createElement("span");

        empty.className = "empty";
        empty.textContent =
            "Start typing to see word frequency.";

        topWordsElement.appendChild(empty);

        return;
    }

    words.forEach(item => {

        const wordElement =
            document.createElement("span");

        wordElement.className = "word-frequency";

        wordElement.innerHTML = `
            <strong>${escapeHTML(item.word)}</strong>
            <small>${item.count}</small>
        `;

        topWordsElement.appendChild(
            wordElement
        );
    });
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}

// ============================================================
// LIVE TEXT ANALYSIS
// ============================================================

if (textInput) {

    textInput.addEventListener(
        "input",
        function () {

            const text =
                textInput.value;

            const result =
                analyzeText(text);

            updateUI(result);

            // Clear upload message when user types
            if (text.trim() && uploadStatus) {
                uploadStatus.textContent = "";
            }
        }
    );
}

// ============================================================
// CLEAR BUTTON
// ============================================================

if (clearButton) {

    clearButton.addEventListener(
        "click",
        function () {

            if (textInput) {
                textInput.value = "";
                textInput.focus();
            }

            currentAnalysis =
                analyzeText("");

            updateUI(currentAnalysis);

            if (fileInput) {
                fileInput.value = "";
            }

            if (uploadStatus) {
                uploadStatus.textContent = "";
            }
        }
    );
}

// ============================================================
// COPY TEXT
// ============================================================

if (copyTextButton) {

    copyTextButton.addEventListener(
        "click",
        async function () {

            const text =
                textInput?.value || "";

            if (!text) {
                showStatus(
                    "There is no text to copy."
                );
                return;
            }

            try {

                await navigator.clipboard.writeText(
                    text
                );

                showStatus(
                    "Text copied successfully."
                );

            } catch (error) {

                showStatus(
                    "Unable to copy text."
                );
            }
        }
    );
}

// ============================================================
// FILE INPUT
// ============================================================

if (fileInput) {

    fileInput.addEventListener(
        "change",
        function () {

            if (fileInput.files.length > 0) {
                uploadFile(
                    fileInput.files[0]
                );
            }
        }
    );
}

// ============================================================
// DRAG & DROP
// ============================================================

if (dropZone) {

    dropZone.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

            dropZone.classList.add(
                "drag-over"
            );
        }
    );

    dropZone.addEventListener(
        "dragleave",
        function () {

            dropZone.classList.remove(
                "drag-over"
            );
        }
    );

    dropZone.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();

            dropZone.classList.remove(
                "drag-over"
            );

            const files =
                event.dataTransfer.files;

            if (files.length > 0) {
                uploadFile(files[0]);
            }
        }
    );
}

// ============================================================
// UPLOAD FILE
// ============================================================

async function uploadFile(file) {

    const allowedExtensions = [
        ".pdf",
        ".docx",
        ".txt",
        ".csv"
    ];

    const extension =
        "." +
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    if (!allowedExtensions.includes(extension)) {

        showStatus(
            "Unsupported file. Use PDF, DOCX, TXT or CSV."
        );

        return;
    }

    // 20 MB limit
    if (
        file.size >
        20 * 1024 * 1024
    ) {

        showStatus(
            "File is larger than 20 MB."
        );

        return;
    }

    showStatus(
        `Analyzing ${file.name}...`
    );

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );

    try {

        const response =
            await fetch(
                `${API_BASE}/api/analyze-file`,
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "File analysis failed."
            );
        }

        updateUI(data);

        // Put extracted text into editor
        if (
            textInput &&
            typeof data.text === "string"
        ) {
            textInput.value =
                data.text;
        }

        showStatus(
            `✓ ${file.name} analyzed successfully.`
        );

    } catch (error) {

        console.error(
            "Upload error:",
            error
        );

        showStatus(
            `Error: ${error.message}`
        );
    }
}

// ============================================================
// STATUS MESSAGE
// ============================================================

function showStatus(message) {

    if (!uploadStatus) {
        return;
    }

    uploadStatus.textContent =
        message;
}

// ============================================================
// COPY RESULTS
// ============================================================

if (copyResultsButton) {

    copyResultsButton.addEventListener(
        "click",
        async function () {

            const resultText =
                createReportText();

            try {

                await navigator.clipboard.writeText(
                    resultText
                );

                showStatus(
                    "✓ Results copied successfully."
                );

            } catch (error) {

                showStatus(
                    "Unable to copy results."
                );
            }
        }
    );
}

// ============================================================
// CREATE REPORT
// ============================================================

function createReportText() {

    const topWords =
        currentAnalysis.top_words || [];

    const topWordText =
        topWords.length > 0
            ? topWords
                .map(
                    item =>
                        `${item.word}: ${item.count}`
                )
                .join(", ")
            : "None";

    return `
WordCounter Pro
==============================

Words: ${currentAnalysis.words}
Characters: ${currentAnalysis.characters}
Characters Without Spaces: ${currentAnalysis.characters_no_spaces}
Paragraphs: ${currentAnalysis.paragraphs}
Sentences: ${currentAnalysis.sentences}
Lines: ${currentAnalysis.lines}
Unique Words: ${currentAnalysis.unique_words}

Reading Time: ${currentAnalysis.reading_minutes} min
Speaking Time: ${currentAnalysis.speaking_minutes} min

Average Word Length: ${currentAnalysis.average_word_length}
Longest Word: ${currentAnalysis.longest_word || "—"}

Most Used Words:
${topWordText}

==============================
Generated by WordCounter Pro
`.trim();
}

// ============================================================
// DOWNLOAD REPORT
// ============================================================

if (downloadResultsButton) {

    downloadResultsButton.addEventListener(
        "click",
        function () {

            const report =
                createReportText();

            const blob =
                new Blob(
                    [report],
                    {
                        type:
                            "text/plain;charset=utf-8"
                    }
                );

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                "WordCounter-Pro-Report.txt";

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        }
    );
}

// ============================================================
// INITIAL STATE
// ============================================================

updateUI(
    analyzeText("")
);

console.log(
    "WordCounter Pro initialized successfully."
);