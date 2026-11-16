document.addEventListener("DOMContentLoaded", () => {
    const cardGrid = document.getElementById("card-grid");
    const readerView = document.getElementById("reader-view");
    const markdownContent = document.getElementById("markdown-content");
    const searchInput = document.getElementById("search-input");
    const categoryFilters = document.getElementById("category-filters");
    const backBtn = document.getElementById("back-btn");
    const themeToggle = document.getElementById("theme-toggle");
    const filterBarContainer = document.querySelector(".filter-bar");

    let allNotes = [];
    let currentCategory = "all";

    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    themeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    });

    fetch("data/notes.json")
        .then(response => response.json())
        .then(data => {
            allNotes = data;
            initCategories(data);
            renderCards(data);
        })
        .catch(err => console.error("無法載入筆記索引：", err));

    function initCategories(notes) {
        const categories = ["all", ...new Set(notes.map(n => n.category))];
        categoryFilters.innerHTML = categories.map(cat => `
            <button class="tag-btn ${cat === 'all' ? 'active' : ''}" data-category="${cat}">
                ${cat === 'all' ? '全部類別' : cat}
            </button>
        `).join("");

        categoryFilters.querySelectorAll(".tag-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                categoryFilters.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                currentCategory = e.target.getAttribute("data-category");
                filterAndRender();
            });
        });
    }

    function renderCards(notes) {
        if (notes.length === 0) {
            cardGrid.innerHTML = "<p>沒有找到相關的工程筆記。</p>";
            return;
        }

        cardGrid.innerHTML = notes.map(note => `
            <div class="note-card" data-filename="${note.filename}">
                <div class="note-meta">${note.date} · ${note.category}</div>
                <h3>${note.title}</h3>
                <p class="note-summary">${note.summary}</p>
            </div>
        `).join("");

        document.querySelectorAll(".note-card").forEach(card => {
            card.addEventListener("click", () => {
                const filename = card.getAttribute("data-filename");
                loadMarkdownNote(filename);
            });
        });
    }

    function loadMarkdownNote(filename) {
        fetch(`notes/${filename}`)
            .then(res => res.text())
            .then(mdText => {
                const cleanedMd = mdText.replace(/^---[\s\S]*?---/, "");
                markdownContent.innerHTML = marked.parse(cleanedMd);
                
                cardGrid.classList.add("hidden");
                filterBarContainer.classList.add("hidden");
                readerView.classList.remove("hidden");
                window.scrollTo({ top: 0, behavior: "smooth" });
            })
            .catch(err => alert("載入筆記檔案失敗！"));
    }

    backBtn.addEventListener("click", () => {
        readerView.classList.add("hidden");
        cardGrid.classList.remove("hidden");
        filterBarContainer.classList.remove("hidden");
    });

    function filterAndRender() {
        const keyword = searchInput.value.toLowerCase();
        const filtered = allNotes.filter(note => {
            const matchCategory = currentCategory === "all" || note.category === currentCategory;
            const matchKeyword = note.title.toLowerCase().includes(keyword) || 
                                 note.summary.toLowerCase().includes(keyword) ||
                                 note.tags.some(t => t.toLowerCase().includes(keyword));
            return matchCategory && matchKeyword;
        });
        renderCards(filtered);
    }

    searchInput.addEventListener("input", filterAndRender);
});