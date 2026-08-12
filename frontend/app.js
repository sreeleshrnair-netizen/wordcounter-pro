// =========================================================
// WORDCOUNTER PRO
// Frontend Application
// =========================================================


// =========================================================
// CONFIGURATION
// =========================================================

const API_URL = "https://wordcounter-pro.onrender.com";


// =========================================================
// ELEMENTS
// =========================================================

const textInput = document.getElementById("textInput");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const uploadStatus = document.getElementById("uploadStatus");

const clearButton = document.getElementById("clearButton");
const copyTextButton = document.getElementById("copyTextButton");
const copyResultsButton = document.getElementById("copyResults");
const downloadResultsButton =
    document.getElementById("downloadResults");

const themeButton =
    document.getElementById("themeButton");


// =========================================================
// STAT ELEMENTS
// =========================================================

const statElements = {

    words:
        document.getElementById("words"),

    characters:
        document.getElementById("characters"),

    characters_no_spaces:
        document.getElementById("charactersNoSpaces"),

    paragraphs:
        document.getElementById("paragraphs"),

    sentences:
        document.getElementById("sentences"),

    lines:
        document.getElementById("lines"),

    unique_words:
        document.getElementById("uniqueWords"),

    reading_minutes:
        document.getElementById("readingTime"),

    speaking_minutes:
        document.getElementById("speakingTime"),

    average_word_length:
        document.getElementById("averageWord"),

    longest_word:
        document.getElementById("longestWord"),

    top_words:
        document.getElementById("topWords")
};


// =========================================================
// LOCAL TEXT ANALYSIS
// =========================================================

function analyzeLocalText(text) {

    const normalized =
        text
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");

    const words =
        normalized.match(
            /[^\W_]+(?:['’\-][^\W_]+)*/gu
        ) || [];

    const wordCount =
        words.length;

    const characters =
        normalized.length;

    const charactersNoSpaces =
        normalized.replace(/\s/g, "").length;

    const paragraphs =
        normalized.trim()
            ? normalized
                .trim()
                .split(/\n\s*\n+/)
                .filter(Boolean)
                .length
            : 0;

    const sentenceMatches =
        normalized.match(
            /[^.!?。！？]+[.!?。！？]+/g
        ) || [];

    let sentences =
        sentenceMatches.length;

    if (
        normalized.trim() &&
        sentences === 0
    ) {
        sentences = 1;
    }

    const lines =
        normalized
            .split(/\n/)
            .filter(line => line.trim())
            .length;

    const normalizedWords =
        words.map(
            word => word.toLocaleLowerCase()
        );

    const uniqueWords =
        new Set(normalizedWords).size;

    const frequency = {};

    normalizedWords.forEach(word => {

        frequency[word] =
            (frequency[word] || 0) + 1;
    });

    const topWords =
        Object.entries(frequency)
            .sort(
                (a, b) =>
                    b[1] - a[1] ||
                    a[0].localeCompare(b[0])
            )
            .slice(0, 10);

    let longestWord = "";

    words.forEach(word => {

        if (
            word.replace(/[^\p{L}\p{N}]/gu, "")
                .length >
            longestWord.replace(/[^\p{L}\p{N}]/gu, "")
                .length
        ) {

            longestWord = word;
        }
    });

    let averageWordLength = 0;

    if (wordCount > 0) {

        const total =
            words.reduce(
                (sum, word) =>
                    sum +
                    word.replace(
                        /[^\p{L}\p{N}]/gu,
                        ""
                    ).length,
                0
            );

        averageWordLength =
            Number(
                (total / wordCount).toFixed(2)
            );
    }

    return {

        words: wordCount,

        characters: characters,

        characters_no_spaces:
            charactersNoSpaces,

        paragraphs: paragraphs,

        sentences: sentences,

        lines: lines,

        unique_words: uniqueWords,

        reading_minutes:
            wordCount > 0
                ? Math.max(
                    1,
                    Math.round(wordCount / 200)
                )
                : 0,

        speaking_minutes:
            wordCount > 0
                ? Math.max(
                    1,
                    Math.round(wordCount / 130)
                )
                : 0,

        average_word_length:
            averageWordLength,

        longest_word:
            longestWord,

        top_words:
            topWords.map(
                ([word, count]) => ({
                    word,
                    count
                })
            )
    };
}


// =========================================================
// UPDATE UI
// =========================================================

function updateStatistics(result) {

    statElements.words.textContent =
        result.words ?? 0;

    statElements.characters.textContent =
        result.characters ?? 0;

    statElements.characters_no_spaces.textContent =
        result.characters_no_spaces ?? 0;

    statElements.paragraphs.textContent =
        result.paragraphs ?? 0;

    statElements.sentences.textContent =
        result.sentences ?? 0;

    statElements.lines.textContent =
        result.lines ?? 0;

    statElements.unique_words.textContent =
        result.unique_words ?? 0;

    statElements.reading_minutes.textContent =
        `${result.reading_minutes ?? 0} min`;

    statElements.speaking_minutes.textContent =
        `${result.speaking_minutes ?? 0} min`;

    statElements.average_word_length.textContent =
        result.average_word_length ?? 0;

    statElements.longest_word.textContent =
        result.longest_word || "—";


    // =====================================================
    // TOP WORDS
    // =====================================================

    const topWords =
        result.top_words || [];

    statElements.top_words.innerHTML = "";

    if (topWords.length === 0) {

        const empty =
            document.createElement("span");

        empty.className = "empty";

        empty.textContent =
            "Start typing to see word frequency.";

        statElements.top_words.appendChild(empty);

        return;
    }

    topWords.forEach(
        ({ word, count }, index) => {

            const item =
                document.createElement("div");

            item.className = "word-frequency";

            item.innerHTML = `
                <span>
                    ${index + 1}. ${escapeHTML(word)}
                </span>

                <strong>
                    ${count}
                </strong>
            `;

            statElements.top_words
                .appendChild(item);
        }
    );
}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// LIVE TEXT ANALYSIS
// =========================================================

function analyzeCurrentText() {

    const text =
        textInput.value;

    const result =
        analyzeLocalText(text);

    updateStatistics(result);
}


// =========================================================
// FILE UPLOAD
// =========================================================

async function uploadFile(file) {

    if (!file) {
        return;
    }

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

    if (
        !allowedExtensions.includes(
            extension
        )
    ) {

        showUploadStatus(
            "Unsupported file type.",
            true
        );

        return;
    }

    // 20 MB
    if (
        file.size >
        20 * 1024 * 1024
    ) {

        showUploadStatus(
            "File is larger than 20 MB.",
            true
        );

        return;
    }


    // -----------------------------------------------------
    // Loading state
    // -----------------------------------------------------

    showUploadStatus(
        `Analyzing ${file.name}...`
    );

    dropZone.classList.add(
        "uploading"
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
                `${API_URL}/api/analyze-file`,
                {
                    method: "POST",
                    body: formData
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Unable to analyze file."
            );
        }


        // -------------------------------------------------
        // Put extracted text into editor
        // -------------------------------------------------

        textInput.value =
            result.text || "";


        // -------------------------------------------------
        // Update statistics
        // -------------------------------------------------

        updateStatistics(result);


        // -------------------------------------------------
        // Status
        // -------------------------------------------------

        if (
            result.ocr_required
        ) {

            showUploadStatus(
                `${file.name} contains no selectable text. OCR is required for scanned pages.`,
                true
            );

        } else {

            const pageInfo =
                result.pages
                    ? ` • ${result.pages} pages`
                    : "";

            showUploadStatus(
                `✓ ${file.name} analyzed successfully${pageInfo}`
            );
        }

    } catch (error) {

        console.error(
            "Upload error:",
            error
        );

        showUploadStatus(
            error.message ||
            "Unable to analyze the file.",
            true
        );

    } finally {

        dropZone.classList.remove(
            "uploading"
        );
    }
}


// =========================================================
// UPLOAD STATUS
// =========================================================

function showUploadStatus(
    message,
    isError = false
) {

    uploadStatus.textContent =
        message;

    uploadStatus.classList.toggle(
        "error",
        isError
    );
}


// =========================================================
// FILE INPUT
// =========================================================

fileInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files[0];

        uploadFile(file);
    }
);


// =========================================================
// DRAG AND DROP
// =========================================================

dropZone.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        dropZone.classList.add(
            "drag-over"
        );
    }
);


dropZone.addEventListener(
    "dragleave",
    () => {

        dropZone.classList.remove(
            "drag-over"
        );
    }
);


dropZone.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        dropZone.classList.remove(
            "drag-over"
        );

        const file =
            event.dataTransfer.files[0];

        uploadFile(file);
    }
);


// =========================================================
// LIVE TEXT INPUT
// =========================================================

textInput.addEventListener(
    "input",
    analyzeCurrentText
);


// =========================================================
// CLEAR
// =========================================================

clearButton.addEventListener(
    "click",
    () => {

        textInput.value = "";

        fileInput.value = "";

        showUploadStatus("");

        updateStatistics({
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
            top_words: []
        });
    }
);


// =========================================================
// COPY TEXT
// =========================================================

copyTextButton.addEventListener(
    "click",
    async () => {

        if (!textInput.value) {
            return;
        }

        try {

            await navigator.clipboard.writeText(
                textInput.value
            );

            const original =
                copyTextButton.textContent;

            copyTextButton.textContent =
                "✓ Copied";

            setTimeout(() => {

                copyTextButton.textContent =
                    original;

            }, 1500);

        } catch (error) {

            console.error(error);
        }
    }
);


// =========================================================
// CREATE RESULT TEXT
// =========================================================

function createResultsText() {

    const text =
        textInput.value;

    const result =
        analyzeLocalText(text);

    let output = "";

    output +=
        "WORDCOUNTER PRO\n";

    output +=
        "========================\n\n";

    output +=
        `Words: ${result.words}\n`;

    output +=
        `Characters: ${result.characters}\n`;

    output +=
        `Characters Without Spaces: ${result.characters_no_spaces}\n`;

    output +=
        `Paragraphs: ${result.paragraphs}\n`;

    output +=
        `Sentences: ${result.sentences}\n`;

    output +=
        `Lines: ${result.lines}\n`;

    output +=
        `Unique Words: ${result.unique_words}\n`;

    output +=
        `Reading Time: ${result.reading_minutes} min\n`;

    output +=
        `Speaking Time: ${result.speaking_minutes} min\n`;

    output +=
        `Average Word Length: ${result.average_word_length}\n`;

    output +=
        `Longest Word: ${result.longest_word || "—"}\n\n`;

    output +=
        "MOST USED WORDS\n";

    output +=
        "------------------------\n";

    result.top_words.forEach(
        ({ word, count }, index) => {

            output +=
                `${index + 1}. ${word} — ${count}\n`;
        }
    );

    return output;
}


// =========================================================
// COPY RESULTS
// =========================================================

copyResultsButton.addEventListener(
    "click",
    async () => {

        try {

            await navigator.clipboard.writeText(
                createResultsText()
            );

            const original =
                copyResultsButton.textContent;

            copyResultsButton.textContent =
                "✓ Results Copied";

            setTimeout(() => {

                copyResultsButton.textContent =
                    original;

            }, 1500);

        } catch (error) {

            console.error(error);
        }
    }
);


// =========================================================
// DOWNLOAD REPORT
// =========================================================

downloadResultsButton.addEventListener(
    "click",
    () => {

        const report =
            createResultsText();

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
            "wordcounter-report.txt";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);
    }
);


// =========================================================
// THEME
// =========================================================

function setTheme(theme) {

    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeButton.textContent =
            "☀️";

        localStorage.setItem(
            "wordcounter-theme",
            "dark"
        );

    } else {

        document.body.classList.remove(
            "dark"
        );

        themeButton.textContent =
            "🌙";

        localStorage.setItem(
            "wordcounter-theme",
            "light"
        );
    }
}


themeButton.addEventListener(
    "click",
    () => {

        const dark =
            document.body.classList.contains(
                "dark"
            );

        setTheme(
            dark
                ? "light"
                : "dark"
        );
    }
);


// =========================================================
// LOAD SAVED THEME
// =========================================================

const savedTheme =
    localStorage.getItem(
        "wordcounter-theme"
    );

if (savedTheme) {

    setTheme(savedTheme);

} else {

    setTheme("light");
}


// =========================================================
// INITIAL STATE
// =========================================================

analyzeCurrentText();