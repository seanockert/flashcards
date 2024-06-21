import { createApp } from './petite-vue.es.js';

function uuid() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

const testCards = [
  {
    id: 'c1',
    front: 'Scroll right',
    back: '',
    weight: 1,
    ease: 1
  },
  {
    id: 'c2',
    front: 'Turtle',
    back: 'https://media.istockphoto.com/id/1254985253/vector/cartoon-water-turtle-on-a-blue-background.jpg?s=612x612&w=0&k=20&c=uQJSUWEiVRiLRq6mwIRiMPqob1_SanVvSnM5QzXZpmM=',
    weight: 1,
    ease: 1
  },
  {
    id: 'c3',
    front: 'Elephant',
    back: '',
    weight: 1,
    ease: 1
  },
  {
    id: 'c4',
    front: 'Dog',
    back: '',
    weight: 1,
    ease: 1
  },
  {
    id: 'c5',
    front: 'Chicken',
    back: '',
    weight: 1,
    ease: 1
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
      // Get cards from storage
      const storedData = localStorage.getItem(this.storageKey);
      this.cards = storedData ? JSON.parse(storedData) : this.cards;

      // Update when list changes
      window.addEventListener('storage', this.handleStorageChange);

      this.$nextTick(() => this.createObserver());
    },
    addCard() {
      this.cards.push({ id: uuid(), front: this.newCardInput, back: '' });
      this.newCardInput = '';
      this.updateState(true);
    },
    removeCard(id) {
      this.cards = this.cards.filter((card) => card.id !== id);
      this.updateState(true);
    },
    flipCard(id) {
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
    updateState(modifiedList) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cards));
      if (modifiedList) {
        this.$nextTick(() => this.createObserver());
      }
    },
    handleStorageChange(event) {
      if (event.key === this.storageKey) {
        this.cards = JSON.parse(event.newValue);
        this.$nextTick(() => this.createObserver());
      }
    }
  };
}

createApp({
  Flashcards
}).mount();