// ============================================================
// WordCounter Pro - Frontend
// ============================================================

"use strict";


// ============================================================
// DOM ELEMENTS
// ============================================================

const textInput = document.getElementById("textInput");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

const themeButton = document.getElementById("themeButton");
const clearButton = document.getElementById("clearButton");
const copyTextButton = document.getElementById("copyTextButton");

const copyResultsButton = document.getElementById("copyResults");
const downloadResultsButton =
    document.getElementById("downloadResults");

const uploadStatus =
    document.getElementById("uploadStatus");


// ============================================================
// STATISTICS ELEMENTS
// ============================================================

const wordsElement =
    document.getElementById("words");

const charactersElement =
    document.getElementById("characters");

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


// ============================================================
// DARK MODE
// ============================================================

const THEME_KEY = "wordcounter-theme";


function applyTheme(theme) {

    if (theme === "dark") {

        document.body.classList.add("dark-mode");

        if (themeButton) {
            themeButton.textContent = "☀️";
            themeButton.setAttribute(
                "aria-label",
                "Switch to light mode"
            );
            themeButton.title = "Light mode";
        }

    } else {

        document.body.classList.remove("dark-mode");

        if (themeButton) {
            themeButton.textContent = "🌙";
            themeButton.setAttribute(
                "aria-label",
                "Switch to dark mode"
            );
            themeButton.title = "Dark mode";
        }
    }
}


function initializeTheme() {

    const savedTheme =
        localStorage.getItem(THEME_KEY);

    if (savedTheme === "dark") {

        applyTheme("dark");

    } else {

        applyTheme("light");
    }
}


if (themeButton) {

    themeButton.addEventListener(
        "click",
        function () {

            const isDark =
                document.body.classList.contains(
                    "dark-mode"
                );

            const newTheme =
                isDark ? "light" : "dark";

            applyTheme(newTheme);

            localStorage.setItem(
                THEME_KEY,
                newTheme
            );
        }
    );
}


initializeTheme();


// ============================================================
// LOCAL TEXT ANALYSIS
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
            top_words: []
        };
    }


    text = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");


    // --------------------------------------------------------
    // WORDS
    // --------------------------------------------------------

    const words = text.match(
        /[^\W_]+(?:['’\-][^\W_]+)*/gu
    ) || [];


    // --------------------------------------------------------
    // CHARACTERS
    // --------------------------------------------------------

    const characters =
        text.length;


    const charactersNoSpaces =
        text.replace(/\s/g, "").length;


    // --------------------------------------------------------
    // PARAGRAPHS
    // --------------------------------------------------------

    const paragraphs =
        text.trim()
            ? text
                .trim()
                .split(/\n\s*\n+/)
                .filter(p => p.trim())
                .length
            : 0;


    // --------------------------------------------------------
    // SENTENCES
    // --------------------------------------------------------

    const sentenceMatches =
        text.match(
            /[^.!?。！？]+[.!?。！？]+/g
        ) || [];


    let sentences = 0;

    if (text.trim()) {

        sentences =
            sentenceMatches.length > 0
                ? sentenceMatches.length
                : 1;
    }


    // --------------------------------------------------------
    // LINES
    // --------------------------------------------------------

    const lines =
        text
            .split("\n")
            .filter(
                line => line.trim().length > 0
            )
            .length;


    // --------------------------------------------------------
    // UNIQUE WORDS
    // --------------------------------------------------------

    const normalizedWords =
        words.map(
            word => word.toLocaleLowerCase()
        );


    const uniqueSet =
        new Set(normalizedWords);


    // --------------------------------------------------------
    // FREQUENCY
    // --------------------------------------------------------

    const frequency = {};


    normalizedWords.forEach(
        word => {

            frequency[word] =
                (frequency[word] || 0) + 1;
        }
    );


    const topWords =
        Object.entries(frequency)
            .sort(
                (a, b) => {

                    if (b[1] !== a[1]) {
                        return b[1] - a[1];
                    }

                    return a[0]
                        .localeCompare(b[0]);
                }
            )
            .slice(0, 10)
            .map(
                item => ({
                    word: item[0],
                    count: item[1]
                })
            );


    // --------------------------------------------------------
    // LONGEST WORD
    // --------------------------------------------------------

    let longestWord = "";

    if (words.length > 0) {

        longestWord =
            words.reduce(
                (longest, current) => {

                    return current.length >
                        longest.length
                        ? current
                        : longest;
                }
            );
    }


    // --------------------------------------------------------
    // AVERAGE WORD LENGTH
    // --------------------------------------------------------

    let totalLength = 0;

    words.forEach(
        word => {

            const clean =
                word.replace(
                    /[^\p{L}\p{N}]/gu,
                    ""
                );

            totalLength +=
                clean.length;
        }
    );


    const averageWordLength =
        words.length > 0
            ? Number(
                (
                    totalLength /
                    words.length
                ).toFixed(2)
            )
            : 0;


    // --------------------------------------------------------
    // TIME
    // --------------------------------------------------------

    const readingMinutes =
        words.length > 0
            ? Math.max(
                1,
                Math.round(
                    words.length / 200
                )
            )
            : 0;


    const speakingMinutes =
        words.length > 0
            ? Math.max(
                1,
                Math.round(
                    words.length / 130
                )
            )
            : 0;


    return {

        words: words.length,

        characters,

        characters_no_spaces:
            charactersNoSpaces,

        paragraphs,

        sentences,

        lines,

        unique_words:
            uniqueSet.size,

        reading_minutes:
            readingMinutes,

        speaking_minutes:
            speakingMinutes,

        average_word_length:
            averageWordLength,

        longest_word:
            longestWord,

        top_words:
            topWords
    };
}


// ============================================================
// UPDATE UI
// ============================================================

function updateStatistics(result) {

    wordsElement.textContent =
        result.words ?? 0;

    charactersElement.textContent =
        result.characters ?? 0;

    charactersNoSpacesElement.textContent =
        result.characters_no_spaces ?? 0;

    paragraphsElement.textContent =
        result.paragraphs ?? 0;

    sentencesElement.textContent =
        result.sentences ?? 0;

    linesElement.textContent =
        result.lines ?? 0;

    uniqueWordsElement.textContent =
        result.unique_words ?? 0;

    readingTimeElement.textContent =
        `${result.reading_minutes ?? 0} min`;

    speakingTimeElement.textContent =
        `${result.speaking_minutes ?? 0} min`;

    averageWordElement.textContent =
        result.average_word_length ?? 0;

    longestWordElement.textContent =
        result.longest_word || "—";


    // --------------------------------------------------------
    // TOP WORDS
    // --------------------------------------------------------

    topWordsElement.innerHTML = "";


    if (
        !result.top_words ||
        result.top_words.length === 0
    ) {

        const empty =
            document.createElement("span");

        empty.className = "empty";

        empty.textContent =
            "Start typing to see word frequency.";

        topWordsElement.appendChild(
            empty
        );

        return;
    }


    result.top_words.forEach(
        item => {

            const element =
                document.createElement("span");

            element.className =
                "word-frequency";

            element.textContent =
                `${item.word} (${item.count})`;

            topWordsElement.appendChild(
                element
            );
        }
    );
}


// ============================================================
// LIVE TEXT ANALYSIS
// ============================================================

function updateFromText() {

    const text =
        textInput.value;

    const result =
        analyzeText(text);

    updateStatistics(result);
}


if (textInput) {

    textInput.addEventListener(
        "input",
        updateFromText
    );
}


// ============================================================
// CLEAR
// ============================================================

if (clearButton) {

    clearButton.addEventListener(
        "click",
        function () {

            textInput.value = "";

            if (fileInput) {
                fileInput.value = "";
            }

            if (uploadStatus) {
                uploadStatus.textContent = "";
            }

            updateFromText();
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

            try {

                await navigator.clipboard.writeText(
                    textInput.value
                );

                showStatus(
                    "Text copied successfully.",
                    false
                );

            } catch {

                showStatus(
                    "Unable to copy text.",
                    true
                );
            }
        }
    );
}


// ============================================================
// UPLOAD FILE
// ============================================================

if (fileInput) {

    fileInput.addEventListener(
        "change",
        function () {

            if (
                fileInput.files &&
                fileInput.files.length > 0
            ) {

                processFile(
                    fileInput.files[0]
                );
            }
        }
    );
}


// ============================================================
// DRAG AND DROP
// ============================================================

if (dropZone) {

    [
        "dragenter",
        "dragover"
    ].forEach(
        eventName => {

            dropZone.addEventListener(
                eventName,
                function (event) {

                    event.preventDefault();

                    dropZone.classList.add(
                        "drag-active"
                    );
                }
            );
        }
    );


    [
        "dragleave",
        "drop"
    ].forEach(
        eventName => {

            dropZone.addEventListener(
                eventName,
                function (event) {

                    event.preventDefault();

                    dropZone.classList.remove(
                        "drag-active"
                    );
                }
            );
        }
    );


    dropZone.addEventListener(
        "drop",
        function (event) {

            const files =
                event.dataTransfer.files;

            if (
                files &&
                files.length > 0
            ) {

                processFile(files[0]);
            }
        }
    );
}


// ============================================================
// PROCESS FILE
// ============================================================

async function processFile(file) {

    const allowedTypes = [
        ".pdf",
        ".docx",
        ".txt",
        ".csv"
    ];


    const fileName =
        file.name.toLowerCase();


    const extension =
        "." +
        fileName.split(".").pop();


    if (
        !allowedTypes.includes(
            extension
        )
    ) {

        showStatus(
            "Unsupported file. Use PDF, DOCX, TXT or CSV.",
            true
        );

        return;
    }


    if (
        file.size >
        20 * 1024 * 1024
    ) {

        showStatus(
            "File is larger than 20 MB.",
            true
        );

        return;
    }


    showStatus(
        `Analyzing ${file.name}...`,
        false
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
                "/api/analyze-file",
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
                "Unable to analyze file."
            );
        }


        // Put extracted text into editor
        if (
            typeof data.text ===
            "string"
        ) {

            textInput.value =
                data.text;
        }


        updateStatistics(data);


        if (
            data.ocr_required
        ) {

            showStatus(
                "This PDF appears to be scanned/image-based. OCR is required for accurate word counting.",
                true
            );

        } else {

            showStatus(
                `${file.name} analyzed successfully.`,
                false
            );
        }


    } catch (error) {

        console.error(error);

        showStatus(
            error.message ||
            "Could not analyze the file.",
            true
        );
    }
}


// ============================================================
// STATUS MESSAGE
// ============================================================

function showStatus(
    message,
    isError = false
) {

    if (!uploadStatus) {
        return;
    }

    uploadStatus.textContent =
        message;

    uploadStatus.classList.toggle(
        "error",
        isError
    );
}


// ============================================================
// COPY RESULTS
// ============================================================

if (copyResultsButton) {

    copyResultsButton.addEventListener(
        "click",
        async function () {

            const results =
                getResultsText();


            try {

                await navigator.clipboard.writeText(
                    results
                );

                showStatus(
                    "Results copied successfully.",
                    false
                );

            } catch {

                showStatus(
                    "Unable to copy results.",
                    true
                );
            }
        }
    );
}


// ============================================================
// RESULTS TEXT
// ============================================================

function getResultsText() {

    return `
WordCounter Pro
================

Words: ${wordsElement.textContent}
Characters: ${charactersElement.textContent}
Characters Without Spaces: ${charactersNoSpacesElement.textContent}
Paragraphs: ${paragraphsElement.textContent}
Sentences: ${sentencesElement.textContent}
Lines: ${linesElement.textContent}
Unique Words: ${uniqueWordsElement.textContent}
Reading Time: ${readingTimeElement.textContent}
Speaking Time: ${speakingTimeElement.textContent}

Average Word Length: ${averageWordElement.textContent}
Longest Word: ${longestWordElement.textContent}
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
                getResultsText();


            const blob =
                new Blob(
                    [report],
                    {
                        type:
                            "text/plain;charset=utf-8"
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );

            link.href = url;

            link.download =
                "wordcounter-report.txt";

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            URL.revokeObjectURL(
                url
            );
        }
    );
}