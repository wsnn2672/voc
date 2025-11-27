import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, updateDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAqmyPAh1E_CP55qwRzt4_WKx-Z7MiNukU",
  authDomain: "isef-als.firebaseapp.com",
  projectId: "isef-als",
  storageBucket: "isef-als.firebasestorage.app",
  messagingSenderId: "648912562876",
  appId: "1:648912562876:web:064297fc24a58882cdbeb9"
};

const API_KEY = "AIzaSyBZH6DdYWId03IiXaXRzgRucjAGkqnqZ6Q";
var language = "English";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async (e) => {
  const themeToggle = document.getElementById('theme-toggle');
  const langToggle = document.getElementById('lang-toggle');
  const modeToggle = document.getElementById('mode-toggle');
  const submitBtn = document.getElementById('submitBtn');
  const addForm = document.getElementById('add-word-form');
  const englishInput = document.getElementById('english-word');
  const turkishInput = document.getElementById('turkish-word');
  const vocabList = document.getElementById('vocab-list');
  const page_title = document.getElementById('page-title');
  const page_title2 = document.getElementById('page-title2');
  localStorage.setItem('word-mode', 'vocabulary');
  await loadWordsFromFirestore();

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '🌙';
  } else {
    themeToggle.textContent = '☀️';
  }

  async function loadWordsFromFirestore() {
    const docRef = doc(db, "Words", "doc");
    const acrRef = doc(db, "Words", "acr");

    const mode = localStorage.getItem('word-mode');
    const activeRef = mode === 'acronym' ? acrRef : docRef;

    const docSnap = await getDoc(activeRef);
    if (docSnap.exists()) {
      const data = docSnap.data();

      const wordsArray = Object.entries(data).map(([key, value]) => ({
        en: key,
        tr: value
      }));

      renderGroupedWords(wordsArray);
    } else {
      vocabList.innerHTML = "<p>There is no word.</p>";
    }
  }


  async function addWordToFirestore(key, value) {
    const docRef = doc(db, "Words", "doc");
    const acrRef = doc(db, "Words", "acr");

    const mode = localStorage.getItem('word-mode');
    const activeRef = mode === 'acronym' ? acrRef : docRef;

    if (mode === 'acronym') {
      await updateDoc(activeRef, {
        [key]: value
      });
      console.log("Acronym Added:", key, "=", value);
    }
    else {
      await updateDoc(activeRef, {
        [capitalizeRest(key)]: capitalizeRest(value)
      });
      console.log("Word Added:", key, "=", value);
    }
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = '🌙';
    } else {
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = '☀️';
    }
  });

  modeToggle.addEventListener('click', async (e) => {
    document.body.classList.toggle('word-mode');
    if (localStorage.getItem('word-mode') === 'acronym') {
      localStorage.setItem('word-mode', 'vocabulary');
      modeToggle.textContent = 'Acr';
      page_title.textContent = 'ISEF Team Vocabulary';
      englishInput.placeholder = 'English Word';
      turkishInput.placeholder = 'Turkish Word';
      page_title2.textContent = 'Word List';
      submitBtn.textContent = 'Add Word';
    } else {
      localStorage.setItem('word-mode', 'acronym');
      modeToggle.textContent = 'Voc';
      page_title.textContent = 'ISEF Team Acronym';
      englishInput.placeholder = 'Acronym';
      turkishInput.placeholder = 'Full Form';
      page_title2.textContent = 'Acronym List';
      submitBtn.textContent = 'Add Acronym';
    }
    await loadWordsFromFirestore();
  });

  langToggle.addEventListener('click', async (e) => {
    document.body.classList.toggle('language');

    if (document.body.classList.contains('language')) {
      localStorage.setItem('language', 'Türkçe');
      language = 'Türkçe';
    } else {
      localStorage.setItem('language', 'English');
      language = 'English';
    }

    //
    await loadWordsFromFirestore();
  });

  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const english = englishInput.value.trim();
    const turkish = turkishInput.value.trim();

    if (english && turkish) {
      await addWordToFirestore(english, turkish);
      await loadWordsFromFirestore();
      englishInput.value = '';
      turkishInput.value = '';
      englishInput.focus();
    }
  });

  /*
  vocabList.addEventListener('click', (e) => {
    if (e.target.classList.contains('ai-button')) {
      const button = e.target;
      const li = button.closest('li');
      const descriptionContainer = li.querySelector('.description-container');
      const englishWord = li.querySelector('.english').textContent;

      if (descriptionContainer.style.display === 'block') {
        descriptionContainer.style.display = 'none';
        button.textContent = '🤖 AI Açıklama';
      } else {
        getAIDescription(englishWord, descriptionContainer, button);
      }
    }
  });
  */

  async function getAIDescription(word, container, button) {
    button.textContent = 'Düşünüyor...';
    button.disabled = true;

    const prompt = `"${word}" kelimesini ${language} dilinde, başlıksız ve girişsiz, düz metin olarak sözlük gibi tanımla.`;

    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;

      container.innerHTML = text.replace(/\n/g, '<br>');
      container.style.display = 'block';

      button.textContent = 'Gizle';
      button.disabled = false;

    } catch (error) {
      console.error("Hata:", error);
      container.innerHTML = 'Açıklama getirilirken bir hata oluştu. Lütfen tekrar deneyin.';
      container.style.display = 'block';

      button.textContent = 'Tekrar Dene';
      button.disabled = false;
    }
  }

  function renderGroupedWords(words) {
    const listContainer = document.getElementById('vocab-list');
    listContainer.innerHTML = "";

    const sortKey = language === "English" ? "en" : "tr";

    // Alfabetik sıraya diz
    words.sort((a, b) => a[sortKey].localeCompare(b[sortKey]));

    const groups = {};

    words.forEach(word => {
      const firstLetter = word[sortKey].charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(word);
    });

    // Grupları render et
    for (const letter in groups) {
      // Başlık + separator
      const header = document.createElement('h2');
      header.className = "group-header";

      // Burada innerHTML yerine oluşturma yöntemi daha güvenli:
      const letterText = document.createElement('span');
      letterText.textContent = letter;

      const line = document.createElement('span');
      line.className = "header-line";

      header.appendChild(letterText);
      header.appendChild(line);

      listContainer.appendChild(header);

      groups[letter].forEach(word => {
        const li = document.createElement('li');
        li.innerHTML = `
      <div class="word-pair ${language === "English" ? "en-left" : "tr-left"}">
        <span class="english">${escapeHTML(word.en)}</span>
        <span class="turkish">${escapeHTML(word.tr)}</span>
      </div>
    `;
        listContainer.appendChild(li);
      });
    }
  }

  function capitalizeRest(word) {
    if (!word) return "";
    return word.charAt(0) + word.slice(1).toLowerCase();
  }

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (match) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return map[match];
    });
  }
});
