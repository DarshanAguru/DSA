document.addEventListener("DOMContentLoaded", () => {
    const GITHUB_USER = "DarshanAguru";
    const GITHUB_REPO = "DSA";
    const GITHUB_FOLDER = "DSA JAVA";
    const GITHUB_API = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`;
    const GITHUB_RAW = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/${GITHUB_FOLDER}`;

    const resultsContainer = document.querySelector(".results");
    const codeContentElement = document.getElementById("code-content");
    const searchInput = document.getElementById("searchInput");
    const clearButton = document.getElementById("clearButton");
    const copyButton = document.querySelector(".copy-button");

    let allFiles = [];

    async function loadFiles() {
        try {
            const response = await fetch(GITHUB_API, {
                                    headers: {
                                            'Cache-Control': 'no-cache'
                                        }
                                    });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const json = await response.json();
            
            allFiles = json
                .filter(item => item.type === "file" && item.name.endsWith('.txt'))
                .map(item => ({
                    ...item,
                    DisplayName: formatDisplayName(item.name)
                }))
                .sort((a, b) => parseInt(a.DisplayName.split(".")[0]) - parseInt(b.DisplayName.split(".")[0]));
            

            renderList(allFiles);
        } catch (e) {
            console.error("⚠️ Error loading file list:", e);
            resultsContainer.innerHTML = `<div class="result-item">Error loading files.</div>`;
        }
    }

    async function loadContent(filename) {
        const codeDisplay = document.querySelector('.code-display');
        
        codeDisplay.classList.add('loading');
        
        try {
            const res = await fetch(`${GITHUB_RAW}/${filename}`, {
                                        headers: {
                                                'Cache-Control': 'no-cache'
                                              }
                                        });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const text = await res.text();
            renderCode(text);
        } catch (e) {
            renderCode(`📛 Error loading file: ${e.message}`);
        } finally {
            codeDisplay.classList.remove('loading');
        }
    }

    function renderList(items) {
        resultsContainer.innerHTML = "";
        if (items.length === 0) {
            resultsContainer.innerHTML = `<div class="result-item">No matches found.</div>`;
            return;
        }
        items.forEach(file => {
            const div = document.createElement("div");
            div.className = "result-item";
            div.innerText = file.DisplayName;
            
            div.addEventListener("click", () => {
                const allItems = document.querySelectorAll('.result-item');
                allItems.forEach(item => item.classList.remove('active'));
                
                div.classList.add('active');
                
                loadContent(file.name);
            });
            
            resultsContainer.appendChild(div);
        });
    }

    function renderCode(content) {
        codeContentElement.innerHTML = highlightJavaSyntax(content);
    }
    
    function formatDisplayName(filename) {
        let nameArr = filename.split(" ");
        let name = nameArr[1].slice(0, -4).replace(/_/g, ' ');
        let suffix = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ');
        let prefix = nameArr[0] + " ";
        return  prefix + suffix;
    }

    function highlightJavaSyntax(code) {
        const sanitizedCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const tokenPatterns = [
            { type: 'comment',    regex: /(?:\/\/.*)|(?:\/\*[\s\S]*?\*\/)/ },
            { type: 'string',     regex: /"[^"]*"/ },
            { type: 'annotation', regex: /@[A-Za-z_][A-Za-z0-9_]*/ },
            { type: 'keyword',    regex: /\b(?:public|private|System|String|protected|static|final|void|int|float|double|boolean|char|byte|short|long|class|interface|extends|implements|new|try|catch|finally|throw|throws|if|else|for|while|do|switch|case|break|continue|return|import|package|super|this|instanceof|enum)\b/ },
            { type: 'class-name', regex: /\b[A-Z][a-zA-Z0-9_]*\b/ },
            { type: 'method',     regex: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\()/ },
            { type: 'number',     regex: /\b-?\d+(?:\.\d+)?\b/ }
        ];

        const combinedRegex = new RegExp(
            tokenPatterns.map(p => `(${p.regex.source})`).join('|'),
            'g'
        );

        return sanitizedCode.replace(combinedRegex, (...args) => {
            const match = args[0];
            const groups = args.slice(1, 1 + tokenPatterns.length);
            const patternIndex = groups.findIndex(group => group !== undefined);

            if (patternIndex === -1) {
                return match;
            }

            const token = tokenPatterns[patternIndex];
            return `<span class="${token.type}">${match}</span>`;
        });
    }

    function handleSearch(query) {
        const q = query.trim().toLowerCase();
        const filtered = allFiles.filter(f => f.DisplayName.toLowerCase().includes(q));
        renderList(filtered);
    }

    function handleClear() {
        searchInput.value = "";
        renderList(allFiles);
    }

    function handleCopy() {
        const codeText = codeContentElement.innerText;
        navigator.clipboard.writeText(codeText)
            .then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
            })
            .catch(err => console.error('Error copying text: ', err));
    }

    searchInput.addEventListener("input", (e) => handleSearch(e.target.value));
    clearButton.addEventListener("click", handleClear);
    copyButton.addEventListener("click", handleCopy);

    loadFiles();
});
