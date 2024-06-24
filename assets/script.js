import { createApp } from './petite-vue.es.js';

const maxWeight = 10;
const minWeight = 1;
const queueSize = 5;
const weightDecrease = 0.5;
const weightIncrease = 2;

const uuid = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const updateUrlParam = (key, value) => {
  let url = new URL(window.location.href);

  if (value) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key);
  }

  window.history.pushState({}, '', url);
};

// Helper function to find the next item in an array by ID
const findNextItem = (id, items) => {
  const index = items.findIndex((item) => item.id === id);
  return items[(index + 1) % items.length];
};

const testCards = [
  {
    id: 'c1',
    front: 'Flash cards',
    back: 'https://media.istockphoto.com/id/1254985253/vector/cartoon-water-turtle-on-a-blue-background.jpg?s=612x612&w=0&k=20&c=uQJSUWEiVRiLRq6mwIRiMPqob1_SanVvSnM5QzXZpmM=',
    weight: 1,
    ease: 1
  }
];

const testDeck = {
  id: uuid(),
  cards: testCards
};

function Flashcards(props) {
  return {
    activeCardId: null,
    activeDeck: null,
    decks: [testDeck],
    newCardInput: '',
    observer: null,
    reviewQueue: [],
    storageKey: 'fc_decks',
    mounted() {
      // Get cards from storage
      const storedData = localStorage.getItem(this.storageKey);
      // this.cards = storedData ? JSON.parse(storedData) : this.cards;
      this.decks = storedData ? JSON.parse(storedData) : this.decks;

      const urlParams = new URLSearchParams(window.location.search);
      const deckId = urlParams.get('d');

      if (deckId) {
        this.selectDeck(deckId);
      }

      window.addEventListener('popstate', this.updateQueryParam);

      // Update when list changes
      // window.addEventListener('storage', this.handleStorageChange);
      this.updateState(true);
    },
    set cardsContent(newValue) {
      if (!this.activeDeck) {
        return;
      }

      const newFronts = newValue.split('\n');
      const updatedCards = [];

      for (let i = 0; i < newFronts.length; i++) {
        const [front, back] = newFronts[i].split(',');
        if (i < this.activeDeck.cards.length) {
          // Update existing card
          updatedCards.push({ ...this.activeDeck.cards[i], front: front.trim(), back: back?.trim() ?? '' });
        } else {
          // Add new card if it's not empty or not the last line
          updatedCards.push({
            id: uuid(),
            front: front.trim(),
            back: back?.trim() ?? '',
            weight: 1,
            ease: 1
          });
        }
      }

      this.activeDeck.cards = [...updatedCards];
      this.updateState(true);
    },
    get cardsContent() {
      // return this.activeDeck ? this.activeDeck.cards.map((card) => `${card.front} , ${card.back}`).join('\n') : '';
      return this.activeDeck ? this.activeDeck.cards.map((card) => card.front).join('\n') : '';
    },
    addDeck() {
      const deckId = uuid();
      this.decks.push({
        id: deckId,
        cards: [{ id: uuid(), front: 'First card', back: '', weight: 1, ease: 1 }]
      });
      this.activeDeck = this.decks[this.decks.length - 1];
      this.selectDeck(deckId);
    },
    selectDeck(deckId) {
      this.reviewQueue = [];
      this.activeDeck = this.decks.find((deck) => deck.id === deckId);
      updateUrlParam('d', deckId);
      this.updateState(!!deckId);
    },
    removeDeck(deckId) {
      if (confirm('Delete this deck?')) {
        this.activeDeck = null;
        this.decks = this.decks.filter((deck) => deck.id !== deckId);
        this.updateState();
      }
    },
    flipCard(cardId) {
      document.getElementById(cardId)?.classList.toggle('flipped');
    },
    rate(cardId, rating) {
      const card = this.activeDeck.cards.find((c) => c.id === cardId);
      card.weight =
        rating === 'hard'
          ? Math.min(card.weight * weightIncrease, maxWeight)
          : Math.max(card.weight * weightDecrease, minWeight);
      card.ease = rating === 'hard' ? Math.max(1.3, card.ease - 0.2) : Math.min(2.5, card.ease + 0.2);

      this.enqueueCards();

      if (this.enqueueCards.length > 0) {
        this.activeDeck.cards.push(...this.enqueueCards);
      }

      // Scroll to next card
      const nextCard = findNextItem(cardId, this.activeDeck.cards);
      document.getElementById(nextCard.id).scrollIntoView({ behavior: 'smooth' });
      this.updateState(true);
    },
    enqueueCards() {
      let totalWeight = this.activeDeck.cards.reduce((sum, card) => sum + card.weight, 0);
      const remainingSlots = queueSize - this.reviewQueue.length;

      for (let i = 0; i < remainingSlots; i++) {
        let randomWeight = Math.random() * totalWeight;

        for (const card of this.activeDeck.cards) {
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
              this.activeCardId = entry.target.id;
              isIntersecting = true;
            }
          });

          if (!isIntersecting) {
            this.activeCardId = null;
          }
        },
        {
          root: this.$refs.scrollContainer,
          threshold: 0.5
        }
      );

      this.activeDeck.cards.forEach((card) => {
        const elem = document.getElementById(card.id);

        if (elem) {
          this.observer.observe(elem);
        }
      });
    },
    updateState(modifiedList) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.decks));

      if (!this.activeDeck) {
        return;
      }

      this.$nextTick(() => {
        if (modifiedList) {
          textFit(document.getElementsByClassName('front'), { minFontSize: 24, maxFontSize: 160 });
          this.createObserver();
        }
      });
    },
    updateQueryParam() {
      const queryParam = new URLSearchParams(window.location.search).get('d');
      if (!queryParam) {
        this.selectDeck(null);
      }
    },
    handleStorageChange(event) {
      if (event.key === this.storageKey) {
        this.activeDeck.cards = JSON.parse(event.newValue);
        this.$nextTick(() => this.createObserver());
      }
    }
  };
}

createApp({
  Flashcards
}).mount();
