import { createApp } from './petite-vue.es.js';

function uuid() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

const randomizeItemsAfter = (array, id) => {
  const index = array.findIndex((item) => item.id === id);
  if (index === -1) return array;

  const randomized = array.slice(index + 1).sort(() => Math.random() - 0.5);
  return [...array.slice(0, index + 1), ...randomized];
};

const maxWeight = 10;
const minWeight = 1;
const weightIncrease = 2;
const weightDecrease = 0.5;
const queueSize = 5;

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
    cards: [],
    newCardInput: '',
    observer: null,
    reviewQueue: [],
    storageKey: 'flashcards',
    mounted() {
      // Get cards from storage
      const storedData = localStorage.getItem(this.storageKey);
      this.cards = storedData ? JSON.parse(storedData) : this.cards;

      // Update when list changes
      window.addEventListener('storage', this.handleStorageChange);

      this.$nextTick(() => {
        textFit(document.getElementsByClassName('front'), { minFontSize: 24, maxFontSize: 160 });
        this.createObserver();
      });
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
      const card = this.cards.find((c) => c.id === id);
      card.weight =
        rating === 'hard'
          ? Math.min(card.weight * weightIncrease, maxWeight)
          : Math.max(card.weight * weightDecrease, minWeight);
      card.ease = rating === 'hard' ? Math.max(1.3, card.ease - 0.2) : Math.min(2.5, card.ease + 0.2);

      this.enqueueCards();

      if (this.enqueueCards.length > 0) {
        this.cards.push(...this.enqueueCards);
      }

      // Scroll to next card
      const nextCard = this.findNextItem(id, this.cards);
      document.getElementById(nextCard.id).scrollIntoView({ behavior: 'smooth' });
      this.updateState(true);
    },
    findNextItem(id, items) {
      // Helper function to find the next item in an array by ID
      const index = items.findIndex((item) => item.id === id);
      return items[(index + 1) % items.length];
    },
    enqueueCards() {
      let totalWeight = this.cards.reduce((sum, card) => sum + card.weight, 0);
      const remainingSlots = queueSize - this.reviewQueue.length;

      for (let i = 0; i < remainingSlots; i++) {
        let randomWeight = Math.random() * totalWeight;

        for (const card of this.cards) {
          randomWeight -= card.weight;
          if (randomWeight <= 0) {
            this.reviewQueue.push(card);
            totalWeight -= card.weight;
            break;
          }
        }
      }
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

              // Change card order
              // this.cards = randomizeItemsAfter(this.cards, this.activeCard);
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

// fitty('.fit', {
//   minSize: 32,
//   maxSize: 300
// });
