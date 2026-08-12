const API_URL =
    "http://127.0.0.1:8000";


const textInput =
    document.getElementById("textInput");

const fileInput =
    document.getElementById("fileInput");

const dropZone =
    document.getElementById("dropZone");

const uploadStatus =
    document.getElementById("uploadStatus");


let latestResults = {
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



/* --------------------------------------------------
   LOCAL TEXT ANALYSIS
-------------------------------------------------- */

function analyzeLocalText(text) {

    const normalized =
        text
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");


    const words =
        normalized.match(
            /[^\W_]+(?:['’\-][^\W_]+)*/gu
        ) || [];


    const paragraphs =
        normalized.trim()
            ? normalized
                .trim()
                .split(/\n\s*\n+/)
                .filter(Boolean)
            : [];


    const sentences =
        normalized.match(
            /[.!?。！？]+/g
        ) || [];


    const lines =
        normalized
            ? normalized.split("\n")
            : [];


    const uniqueWords =
        new Set(
            words.map(
                word => word.toLocaleLowerCase()
            )
        );


    const frequency = {};


    words.forEach(word => {

        const clean =
            word.toLocaleLowerCase();

        frequency[clean] =
            (frequency[clean] || 0) + 1;

    });


    const topWords =
        Object.entries(frequency)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 10);


    let totalWordLength = 0;


    words.forEach(word => {

        totalWordLength +=
            word
                .replace(
                    /[^\p{L}\p{N}]/gu,
                    ""
                )
                .length;

    });


    const averageWordLength =
        words.length
            ? (
                totalWordLength /
                words.length
            ).toFixed(2)
            : 0;


    const longestWord =
        words.length
            ? words.reduce(
                (longest, current) =>
                    current.length >
                    longest.length
                        ? current
                        : longest,
                ""
            )
            : "";


    return {

        words: words.length,

        characters:
            normalized.length,

        characters_no_spaces:
            normalized.replace(
                /\s/g,
                ""
            ).length,

        paragraphs:
            paragraphs.length,

        sentences:
            sentences.length,

        lines:
            lines.length,

        unique_words:
            uniqueWords.size,

        reading_minutes:
            words.length
                ? Math.max(
                    1,
                    Math.round(
                        words.length / 200
                    )
                )
                : 0,

        speaking_minutes:
            words.length
                ? Math.max(
                    1,
                    Math.round(
                        words.length / 130
                    )
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
            ),

        text: normalized

    };

}



/* --------------------------------------------------
   DISPLAY RESULTS
-------------------------------------------------- */

function displayResults(results) {

    latestResults = {
        ...latestResults,
        ...results
    };


    document.getElementById(
        "words"
    ).textContent =
        Number(
            latestResults.words || 0
        ).toLocaleString();


    document.getElementById(
        "characters"
    ).textContent =
        Number(
            latestResults.characters || 0
        ).toLocaleString();


    document.getElementById(
        "charactersNoSpaces"
    ).textContent =
        Number(
            latestResults.characters_no_spaces || 0
        ).toLocaleString();


    document.getElementById(
        "paragraphs"
    ).textContent =
        Number(
            latestResults.paragraphs || 0
        ).toLocaleString();


    document.getElementById(
        "sentences"
    ).textContent =
        Number(
            latestResults.sentences || 0
        ).toLocaleString();


    document.getElementById(
        "lines"
    ).textContent =
        Number(
            latestResults.lines || 0
        ).toLocaleString();


    document.getElementById(
        "uniqueWords"
    ).textContent =
        Number(
            latestResults.unique_words || 0
        ).toLocaleString();


    document.getElementById(
        "readingTime"
    ).textContent =
        `${latestResults.reading_minutes || 0} min`;


    document.getElementById(
        "speakingTime"
    ).textContent =
        `${latestResults.speaking_minutes || 0} min`;


    document.getElementById(
        "averageWord"
    ).textContent =
        latestResults.average_word_length || 0;


    document.getElementById(
        "longestWord"
    ).textContent =
        latestResults.longest_word || "—";


    renderTopWords();

}



/* --------------------------------------------------
   TOP WORDS
-------------------------------------------------- */

function renderTopWords() {

    const container =
        document.getElementById(
            "topWords"
        );


    if (
        !latestResults.top_words ||
        latestResults.top_words.length === 0
    ) {

        container.innerHTML =
            `<span class="empty">
                Start typing to see word frequency.
             </span>`;

        return;

    }


    container.innerHTML =
        latestResults.top_words
            .map(
                item => `
                <span class="word">
                    ${escapeHTML(item.word)}
                    ·
                    ${item.count}
                </span>
                `
            )
            .join("");

}



/* --------------------------------------------------
   SECURITY
-------------------------------------------------- */

function escapeHTML(value) {

    return String(value)
        .replace(
            /[&<>"']/g,
            character => {

                const entities = {

                    "&": "&amp;",

                    "<": "&lt;",

                    ">": "&gt;",

                    '"': "&quot;",

                    "'": "&#039;"

                };

                return entities[
                    character
                ];

            }
        );

}



/* --------------------------------------------------
   LIVE TEXT ANALYSIS
-------------------------------------------------- */

let analysisTimer;


textInput.addEventListener(
    "input",
    () => {

        clearTimeout(
            analysisTimer
        );


        analysisTimer =
            setTimeout(
                () => {

                    const result =
                        analyzeLocalText(
                            textInput.value
                        );

                    displayResults(
                        result
                    );

                },
                50
            );

    }
);



/* --------------------------------------------------
   FILE UPLOAD
-------------------------------------------------- */

fileInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files[0];

        if (file) {

            processFile(file);

        }

    }
);



async function processFile(file) {

    uploadStatus.textContent =
        `⏳ Analyzing ${file.name}...`;


    const fileName =
        file.name.toLowerCase();


    /*
       TXT and CSV can be processed
       directly in browser.
    */

    if (
        fileName.endsWith(".txt") ||
        fileName.endsWith(".csv")
    ) {

        try {

            const text =
                await file.text();


            textInput.value =
                text;


            const result =
                analyzeLocalText(
                    text
                );


            displayResults(
                result
            );


            uploadStatus.textContent =
                `✓ ${file.name} analyzed`;

        }

        catch (error) {

            uploadStatus.textContent =
                "⚠ Could not read file.";

        }

        return;

    }



    /*
       PDF / DOCX
       → Backend
    */

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    try {

        const response =
            await fetch(
                `${API_URL}/api/analyze-file`,
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
                "File processing failed."
            );

        }


        textInput.value =
            data.text || "";


        displayResults(
            data
        );


        uploadStatus.textContent =
            `✓ ${data.filename} analyzed`;


        if (data.ocr_required) {

            uploadStatus.textContent +=
                " · This appears to be a scanned PDF. OCR will be added in the next version.";

        }

    }

    catch (error) {

        console.error(error);


        uploadStatus.textContent =
            `⚠ ${error.message}`;

    }

}



/* --------------------------------------------------
   DRAG AND DROP
-------------------------------------------------- */

dropZone.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        dropZone.classList.add(
            "dragging"
        );

    }
);


dropZone.addEventListener(
    "dragleave",
    () => {

        dropZone.classList.remove(
            "dragging"
        );

    }
);


dropZone.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        dropZone.classList.remove(
            "dragging"
        );


        const file =
            event.dataTransfer.files[0];


        if (file) {

            processFile(file);

        }

    }
);



/* --------------------------------------------------
   CLEAR
-------------------------------------------------- */

document.getElementById(
    "clearButton"
).addEventListener(
    "click",
    () => {

        textInput.value = "";

        uploadStatus.textContent = "";

        displayResults(
            analyzeLocalText("")
        );

    }
);



/* --------------------------------------------------
   COPY TEXT
-------------------------------------------------- */

document.getElementById(
    "copyTextButton"
).addEventListener(
    "click",
    async () => {

        await navigator.clipboard.writeText(
            textInput.value
        );

        uploadStatus.textContent =
            "✓ Text copied";

    }
);



/* --------------------------------------------------
   COPY RESULTS
-------------------------------------------------- */

document.getElementById(
    "copyResults"
).addEventListener(
    "click",
    async () => {

        const resultText = `

WordCounter Pro Results

Words:
${latestResults.words}

Characters:
${latestResults.characters}

Characters without spaces:
${latestResults.characters_no_spaces}

Paragraphs:
${latestResults.paragraphs}

Sentences:
${latestResults.sentences}

Lines:
${latestResults.lines}

Unique words:
${latestResults.unique_words}

Reading time:
${latestResults.reading_minutes} minutes

Speaking time:
${latestResults.speaking_minutes} minutes

Average word length:
${latestResults.average_word_length}

Longest word:
${latestResults.longest_word}

        `.trim();


        await navigator.clipboard.writeText(
            resultText
        );


        uploadStatus.textContent =
            "✓ Results copied";

    }
);



/* --------------------------------------------------
   DOWNLOAD REPORT
-------------------------------------------------- */

document.getElementById(
    "downloadResults"
).addEventListener(
    "click",
    () => {

        const report = `

WORDCOUNTER PRO REPORT
======================

Words:
${latestResults.words}

Characters:
${latestResults.characters}

Characters without spaces:
${latestResults.characters_no_spaces}

Paragraphs:
${latestResults.paragraphs}

Sentences:
${latestResults.sentences}

Lines:
${latestResults.lines}

Unique words:
${latestResults.unique_words}

Reading time:
${latestResults.reading_minutes} minutes

Speaking time:
${latestResults.speaking_minutes} minutes

Average word length:
${latestResults.average_word_length}

Longest word:
${latestResults.longest_word}

        `.trim();


        const blob =
            new Blob(
                [report],
                {
                    type:
                        "text/plain"
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
            "WordCounter-Pro-Report.txt";


        link.click();


        URL.revokeObjectURL(
            url
        );

    }
);



/* --------------------------------------------------
   DARK MODE
-------------------------------------------------- */

const themeButton =
    document.getElementById(
        "themeButton"
    );


if (
    localStorage.getItem(
        "theme"
    ) === "dark"
) {

    document.body.classList.add(
        "dark"
    );

    themeButton.textContent =
        "☀️";

}


themeButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );


        const dark =
            document.body.classList.contains(
                "dark"
            );


        localStorage.setItem(
            "theme",
            dark
                ? "dark"
                : "light"
        );


        themeButton.textContent =
            dark
                ? "☀️"
                : "🌙";

    }
);



/* --------------------------------------------------
   INITIAL STATE
-------------------------------------------------- */

displayResults(
    analyzeLocalText("")
);