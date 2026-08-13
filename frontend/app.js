// =========================================================
// WordCounter Pro - Complete app.js
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------------------
    // CONFIGURATION
    // -----------------------------------------------------

    const BACKEND_URL = "https://wordcounter-pro.onrender.com";

    // -----------------------------------------------------
    // ELEMENTS
    // -----------------------------------------------------

    const themeButton = document.getElementById("themeButton");
    const textInput = document.getElementById("textInput");
    const clearButton = document.getElementById("clearButton");
    const copyTextButton = document.getElementById("copyTextButton");

    const fileInput = document.getElementById("fileInput");
    const dropZone = document.getElementById("dropZone");
    const uploadStatus = document.getElementById("uploadStatus");

    const copyResults = document.getElementById("copyResults");
    const downloadResults = document.getElementById("downloadResults");

    // -----------------------------------------------------
    // THEME
    // -----------------------------------------------------

    function applyTheme(theme) {

        // Set theme on HTML element
        document.documentElement.dataset.theme = theme;

        // Save theme
        localStorage.setItem("wordcounter-theme", theme);

        // Update button
        if (themeButton) {
            if (theme === "dark") {
                themeButton.textContent = "☀️";
                themeButton.setAttribute(
                    "aria-label",
                    "Switch to light mode"
                );
                themeButton.title = "Switch to light mode";
            } else {
                themeButton.textContent = "🌙";
                themeButton.setAttribute(
                    "aria-label",
                    "Switch to dark mode"
                );
                themeButton.title = "Switch to dark mode";
            }
        }
    }

    function loadTheme() {

        const savedTheme =
            localStorage.getItem("wordcounter-theme");

        if (savedTheme === "light") {
            applyTheme("light");
        } else {
            // Default = dark
            applyTheme("dark");
        }
    }

    if (themeButton) {

        themeButton.addEventListener("click", () => {

            const currentTheme =
                document.documentElement.dataset.theme;

            if (currentTheme === "dark") {
                applyTheme("light");
            } else {
                applyTheme("dark");
            }
        });
    }

    // Load saved theme
    loadTheme();

    // -----------------------------------------------------
    // ANALYSIS
    // -----------------------------------------------------

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

        const normalized =
            text
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");

        const words =
            normalized.match(
                /[^\W_]+(?:['’\-][^\W_]+)*/gu
            ) || [];

        const wordCount = words.length;

        const characters =
            normalized.length;

        const charactersNoSpaces =
            normalized.replace(/\s/g, "").length;

        const paragraphs =
            normalized
                .split(/\n\s*\n+/)
                .filter(p => p.trim().length > 0);

        const sentenceMatches =
            normalized.match(
                /[^.!?。！？]+[.!?。！？]+/gu
            ) || [];

        let sentences =
            sentenceMatches.length;

        if (
            sentences === 0 &&
            normalized.trim().length > 0
        ) {
            sentences = 1;
        }

        const lines =
            normalized
                .split("\n")
                .filter(line => line.trim().length > 0);

        const normalizedWords =
            words.map(word =>
                word.toLocaleLowerCase()
            );

        const uniqueWords =
            new Set(normalizedWords);

        const frequency = {};

        normalizedWords.forEach(word => {
            frequency[word] =
                (frequency[word] || 0) + 1;
        });

        const topWords =
            Object.entries(frequency)
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

        const cleanWords =
            words.map(word =>
                word.replace(
                    /[^\p{L}\p{N}]/gu,
                    ""
                )
            );

        const totalLength =
            cleanWords.reduce(
                (total, word) =>
                    total + word.length,
                0
            );

        const averageWordLength =
            wordCount > 0
                ? Number(
                    (
                        totalLength /
                        wordCount
                    ).toFixed(2)
                )
                : 0;

        let longestWord = "";

        if (cleanWords.length > 0) {

            let longestIndex = 0;

            for (
                let i = 1;
                i < cleanWords.length;
                i++
            ) {

                if (
                    cleanWords[i].length >
                    cleanWords[longestIndex].length
                ) {
                    longestIndex = i;
                }
            }

            longestWord =
                words[longestIndex];
        }

        return {
            words: wordCount,

            characters: characters,

            characters_no_spaces:
                charactersNoSpaces,

            paragraphs:
                paragraphs.length,

            sentences: sentences,

            lines: lines.length,

            unique_words:
                uniqueWords.size,

            reading_minutes:
                wordCount === 0
                    ? 0
                    : Math.max(
                        1,
                        Math.ceil(
                            wordCount / 200
                        )
                    ),

            speaking_minutes:
                wordCount === 0
                    ? 0
                    : Math.max(
                        1,
                        Math.ceil(
                            wordCount / 130
                        )
                    ),

            average_word_length:
                averageWordLength,

            longest_word:
                longestWord,

            top_words:
                topWords
        };
    }

    // -----------------------------------------------------
    // UPDATE STATISTICS
    // -----------------------------------------------------

    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }

    function updateStatistics(result) {

        setText("words", result.words);

        setText(
            "characters",
            result.characters
        );

        setText(
            "charactersNoSpaces",
            result.characters_no_spaces
        );

        setText(
            "paragraphs",
            result.paragraphs
        );

        setText(
            "sentences",
            result.sentences
        );

        setText(
            "lines",
            result.lines
        );

        setText(
            "uniqueWords",
            result.unique_words
        );

        setText(
            "readingTime",
            result.reading_minutes + " min"
        );

        setText(
            "speakingTime",
            result.speaking_minutes + " min"
        );

        setText(
            "averageWord",
            result.average_word_length
        );

        setText(
            "longestWord",
            result.longest_word || "—"
        );

        updateTopWords(result.top_words);
    }

    // -----------------------------------------------------
    // TOP WORDS
    // -----------------------------------------------------

    function updateTopWords(words) {

        const container =
            document.getElementById("topWords");

        if (!container) return;

        container.innerHTML = "";

        if (!words || words.length === 0) {

            const empty =
                document.createElement("span");

            empty.className = "empty";

            empty.textContent =
                "Start typing to see word frequency.";

            container.appendChild(empty);

            return;
        }

        words.forEach(item => {

            const element =
                document.createElement("span");

            element.className =
                "word-frequency";

            const strong =
                document.createElement("strong");

            strong.textContent = item.word;

            const small =
                document.createElement("small");

            small.textContent = item.count;

            element.appendChild(strong);
            element.appendChild(small);

            container.appendChild(element);
        });
    }

    // -----------------------------------------------------
    // LIVE ANALYSIS
    // -----------------------------------------------------

    if (textInput) {

        textInput.addEventListener(
            "input",
            () => {

                updateStatistics(
                    analyzeText(
                        textInput.value
                    )
                );
            }
        );
    }

    // -----------------------------------------------------
    // CLEAR
    // -----------------------------------------------------

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            () => {

                if (textInput) {
                    textInput.value = "";
                }

                updateStatistics(
                    analyzeText("")
                );

                if (uploadStatus) {
                    uploadStatus.textContent = "";
                }

                if (fileInput) {
                    fileInput.value = "";
                }
            }
        );
    }

    // -----------------------------------------------------
    // COPY TEXT
    // -----------------------------------------------------

    if (copyTextButton) {

        copyTextButton.addEventListener(
            "click",
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        textInput
                            ? textInput.value
                            : ""
                    );

                    copyTextButton.textContent =
                        "Copied!";

                    setTimeout(() => {
                        copyTextButton.textContent =
                            "Copy Text";
                    }, 1500);

                } catch (error) {

                    alert(
                        "Unable to copy text."
                    );
                }
            }
        );
    }

    // -----------------------------------------------------
    // FILE INPUT
    // -----------------------------------------------------

    if (fileInput) {

        fileInput.addEventListener(
            "change",
            () => {

                if (
                    fileInput.files &&
                    fileInput.files.length > 0
                ) {
                    uploadFile(
                        fileInput.files[0]
                    );
                }
            }
        );
    }

    // -----------------------------------------------------
    // DRAG & DROP
    // -----------------------------------------------------

    if (dropZone) {

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

                const files =
                    event.dataTransfer.files;

                if (
                    files &&
                    files.length > 0
                ) {
                    uploadFile(files[0]);
                }
            }
        );
    }

    // -----------------------------------------------------
    // FILE UPLOAD
    // -----------------------------------------------------

    async function uploadFile(file) {

        const allowed = [
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

        if (!allowed.includes(extension)) {

            showUploadStatus(
                "Unsupported file type.",
                true
            );

            return;
        }

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

        showUploadStatus(
            "Analyzing " +
            file.name +
            "..."
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
                    `${BACKEND_URL}/api/analyze-file`,
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
                    "File analysis failed."
                );
            }

            updateStatistics(result);

            if (textInput) {
                textInput.value =
                    result.text || "";
            }

            if (result.ocr_required) {

                showUploadStatus(
                    "This PDF appears to be scanned. OCR is required.",
                    true
                );

            } else {

                showUploadStatus(
                    "✓ " +
                    file.name +
                    " analyzed successfully"
                );
            }

        } catch (error) {

            console.error(
                "Upload error:",
                error
            );

            showUploadStatus(
                error.message ||
                "Unable to analyze file.",
                true
            );
        }
    }

    function showUploadStatus(
        message,
        error = false
    ) {

        if (!uploadStatus) return;

        uploadStatus.textContent =
            message;

        uploadStatus.style.color =
            error
                ? "var(--danger)"
                : "var(--accent)";
    }

    // -----------------------------------------------------
    // CREATE REPORT
    // -----------------------------------------------------

    function createReport() {

        const result =
            analyzeText(
                textInput
                    ? textInput.value
                    : ""
            );

        let report = "";

        report +=
            "WORDCOUNTER PRO\n";

        report +=
            "========================\n\n";

        report +=
            `Words: ${result.words}\n`;

        report +=
            `Characters: ${result.characters}\n`;

        report +=
            `Characters Without Spaces: ${result.characters_no_spaces}\n`;

        report +=
            `Paragraphs: ${result.paragraphs}\n`;

        report +=
            `Sentences: ${result.sentences}\n`;

        report +=
            `Lines: ${result.lines}\n`;

        report +=
            `Unique Words: ${result.unique_words}\n`;

        report +=
            `Reading Time: ${result.reading_minutes} min\n`;

        report +=
            `Speaking Time: ${result.speaking_minutes} min\n`;

        report +=
            `Average Word Length: ${result.average_word_length}\n`;

        report +=
            `Longest Word: ${
                result.longest_word || "—"
            }\n\n`;

        report +=
            "MOST USED WORDS\n";

        report +=
            "========================\n";

        result.top_words.forEach(item => {

            report +=
                `${item.word}: ${item.count}\n`;
        });

        return report;
    }

    // -----------------------------------------------------
    // COPY RESULTS
    // -----------------------------------------------------

    if (copyResults) {

        copyResults.addEventListener(
            "click",
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        createReport()
                    );

                    copyResults.textContent =
                        "✓ Copied";

                    setTimeout(() => {

                        copyResults.textContent =
                            "📋 Copy Results";

                    }, 1500);

                } catch (error) {

                    alert(
                        "Unable to copy results."
                    );
                }
            }
        );
    }

    // -----------------------------------------------------
    // DOWNLOAD REPORT
    // -----------------------------------------------------

    if (downloadResults) {

        downloadResults.addEventListener(
            "click",
            () => {

                const report =
                    createReport();

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
    }

    // -----------------------------------------------------
    // INITIAL STATE
    // -----------------------------------------------------

    updateStatistics(
        analyzeText("")
    );

});