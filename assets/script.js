import { createApp } from './petite-vue.es.js';
const testCards = [
  {
    id: 'c1',
    front: 'Scroll right',
    back: '',
    weight: 1
  },
  {
    id: 'c2',
    front: 'Turtle',
    back: '',
    weight: 1
  },
  {
    id: 'c3',
    front: 'Elephant',
    back: '',
    weight: 1
  },
  {
    id: 'c4',
    front: 'Dog',
    back: '',
    weight: 1
  },
  {
    id: 'c5',
    front: 'Chicken',
    back: '',
    weight: 1
  }
];

function Flashcards(props) {
  return {
    activeCard: null,
    cards: testCards,
    newCardInput: '',
    observer: null,
    storageKey: 'flashcards',
    mounted() {
      this.init();
    },
    init() {
      // Get cards
      const storedData = localStorage.getItem(this.storageKey);
      this.cards = storedData ? JSON.parse(storedData) : this.cards;

      // Update when list changes
      window.addEventListener('storage', this.handleStorageChange);

      this.$nextTick(() => this.createObserver());
    },
    addCard() {
      this.cards.push({ id: `c${this.cards.length + 1}`, front: this.newCardInput, back: '' });
      this.newCardInput = '';
      this.updateState(true);
    },
    removeCard(id) {
      this.cards = this.cards.filter((card) => card.id !== id);
      this.updateState(true);
    },
    flip(id) {
      document.getElementById(id)?.classList.toggle('flipped');
    },
    rate(id, rating) {
      const nextCard = this.findNextItem(id, this.cards);
      const $card = document.getElementById(nextCard.id);
      $card.scrollIntoView({ behavior: 'smooth' });
      this.updateState();
    },
    findNextItem(id, items) {
      // Helper function to find the next item in an array by ID
      const index = items.findIndex((item) => item.id === id);
      return items[(index + 1) % items.length];
    },
    createObserver() {
      // Update active item when scrolled
      if (this.observer) {
        this.observer.disconnect();
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          let isIntersecting = false;

          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.activeCard = entry.target.id;
              isIntersecting = true;
            }
          });

          if (!isIntersecting) {
            this.activeCard = null;
          }
        },
        {
          root: this.$refs.scrollContainer,
          threshold: 0.5
        }
      );

      this.cards.forEach((card) => {
        const elem = document.getElementById(card.id);

        if (elem) {
          this.observer.observe(elem);
        }
      });
    },
    updateState(changedArrLength) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cards));
      if (changedArrLength) {
        this.$nextTick(() => this.createObserver());
      }
    },
    handleStorageChange(event) {
      if (event.key === this.storageKey) {
        this.cards = JSON.parse(event.newValue);
      }
    }
  };
}

createApp({
  Flashcards
}).mount();

// const buttonFlip = document.querySelectorAll('.flip-card');

// const flipCard = (e) => {
//   e.target.closest('.card').classList.toggle('flip');
// };

// buttonFlip.forEach((btn) => {
//   btn.addEventListener('click', flipCard);
// });
