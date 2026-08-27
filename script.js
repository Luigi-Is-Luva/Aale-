const flashcards = [
  {
    tag: "Biology",
    front: "What does chlorophyll do?",
    back: "Chlorophyll absorbs light energy so plants can make glucose."
  },
  {
    tag: "Study Skill",
    front: "What should you do after class?",
    back: "Spend 20 minutes rewriting the main ideas while they are still fresh."
  },
  {
    tag: "Exam Prep",
    front: "Why should flashcards be mixed?",
    back: "Mixing topics helps you practice remembering, not just recognizing."
  }
];

let cardIndex = 0;
let cardOpen = false;

function renderFlashcard() {
  const tag = document.querySelector("#cardTag");
  const front = document.querySelector("#cardFront");
  const back = document.querySelector("#cardBack");
  if (!tag || !front || !back) return;

  const currentCard = flashcards[cardIndex];
  tag.textContent = currentCard.tag;
  front.textContent = currentCard.front;
  back.textContent = cardOpen ? currentCard.back : "Tap to reveal answer";
}

function wireFlashcards() {
  const card = document.querySelector("#flashcard");
  const next = document.querySelector("#nextCardButton");
  if (!card || !next) return;

  card.addEventListener("click", () => {
    cardOpen = !cardOpen;
    renderFlashcard();
  });

  next.addEventListener("click", () => {
    cardIndex = (cardIndex + 1) % flashcards.length;
    cardOpen = false;
    renderFlashcard();
  });
}

function wireDemoButtons() {
  document.querySelectorAll("[data-demo]").forEach((button) => {
    button.addEventListener("click", () => {
      const originalText = button.textContent;
      button.textContent = "Demo generated";
      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1400);
    });
  });
}

renderFlashcard();
wireFlashcards();
wireDemoButtons();
